import { Behavior } from '@babylonjs/core/Behaviors/behavior';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { KeyboardEventTypes, KeyboardInfo } from '@babylonjs/core/Events/keyboardEvents';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { WebXRExperienceHelper, WebXRState } from '@babylonjs/core/XR';
import { Nullable } from '@babylonjs/core/types';

import { CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME, MAX_POURING_DISTANCE, POURING_RATE, ROTATION_RATE } from './constants';
import { sop, pourRedCylinderTask, pourBlueCylinderTask, pourableTargets } from './globals';
import { getChildMeshByName } from './utils';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import HighlightBehavior from './HighlightBehavior';

// TODO: support setting a custom plane against which to pour. Currently the pouring axis is hardcoded to be the xy-plane.
export default class PouringBehavior implements Behavior<AbstractMesh> {
    target: Nullable<AbstractMesh>;
    sourceRadius: number;
    source!: AbstractMesh;
    pouring!: boolean;
    pourKey = 'e';
    xr?: WebXRExperienceHelper;

    constructor(sourceRadius: number, xr?: WebXRExperienceHelper) {
        this.target = null;
        this.sourceRadius = sourceRadius;
        this.xr = xr;
    }

    get name() {
        return 'Pouring';
    }

    init() {
        this.pouring = false;
    }
    
    attach = (source: AbstractMesh) => {
        this.source = source;
        const scene = this.source.getScene();
        scene.onBeforeRenderObservable.add(this.#renderFn);
        scene.onKeyboardObservable.add(this.#pourKeyFn);
    }

    detach = () => {
        const scene = this.source.getScene();
        scene.onBeforeRenderObservable.removeCallback(this.#renderFn);
        scene.onKeyboardObservable.removeCallback(this.#pourKeyFn);
    }

    calculatePouringRotation = (targetMesh: AbstractMesh): Vector3 => {
        const sourceBoundingBox = getChildMeshByName(this.source, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox;
        const liquidMesh = getChildMeshByName(this.source, CYLINDER_LIQUID_MESH_NAME)!;
        const liquidMeshMaterial = liquidMesh.material as StandardMaterial;
        const liquidBoundingBox = liquidMesh.getBoundingInfo().boundingBox;
        const cylinderWidth = sourceBoundingBox.maximum.x - sourceBoundingBox.minimum.x;
        const cylinderHeight = sourceBoundingBox.maximum.y - sourceBoundingBox.minimum.y;
        const liquidHeight = liquidMeshMaterial.alpha * (liquidBoundingBox.maximum.y - liquidBoundingBox.minimum.y);

        const theta = -Math.atan((2 * (cylinderHeight - liquidHeight)) / cylinderWidth);
        const rotation = new Vector3(0, this.source.absolutePosition.x < targetMesh.absolutePosition.x ? 0 : Math.PI, theta);
        return rotation;
    }

    #pourable = (target: AbstractMesh): boolean => {
        const distance = Vector3.Distance(this.source.absolutePosition, target.absolutePosition);
        return this.source.absolutePosition.y >= getChildMeshByName(target, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox.maximumWorld.y && distance >= this.sourceRadius && distance <= MAX_POURING_DISTANCE;
    }

    acquireTarget = (): Nullable<AbstractMesh> => {
        // Find the closest pourable mesh
        let targetInfo = {
            mesh: null as Nullable<AbstractMesh>,
            dist: Number.MAX_VALUE
        };
        const sourceCenter = getChildMeshByName(this.source, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox.centerWorld;
        pourableTargets.forEach(mesh => {
            const meshCenter = getChildMeshByName(mesh, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox.centerWorld;
            if (this.#pourable(mesh)) {
                const dist = Vector3.Distance(sourceCenter, meshCenter);
                if (dist < targetInfo.dist) {
                    targetInfo = { mesh, dist };
                }
            }
        });

        return targetInfo.mesh!;
    }

    calculateRestingRotation = (): Vector3 => new Vector3(0, this.source.position.x < (this.target ? this.target.position.x : 0) ? 0 : Math.PI, 0);

    smoothRotateSource = (rotation: Vector3, rate = ROTATION_RATE) => {
        this.source.rotation.addInPlace(rotation.subtract(this.source.rotation).scaleInPlace(rate));  // rate is the velocity factor.
    }

    #renderFn = (): void => {
        // TODO: treat this.pouring better. For example, this.pouring can be true in the beginning of this call but then become false later. Really pouring should only change when it is actually supposed to change.
        // this.source.rotationQuaternion = null;
        // const targetCylinderBoundingBox = this.target.getChildMeshes().find(mesh => mesh.name === 'cylinder')?.getBoundingInfo().boundingBox!;
        // this.source.position = new Vector3(targetCylinderBoundingBox.centerWorld.x + 0.5, targetCylinderBoundingBox.maximumWorld.y + 1, targetCylinderBoundingBox.centerWorld.z);
        // TODO: I can think of scenarios where the target may be unhighlighted when it should be highlighted - a race condition with other cylinders that have that target. The solution might be complicated, e.g. numReferences, possibly extractable into a new behavior.

        const target = this.acquireTarget();
        if (target !== this.target) {
            if (this.target) {
                const sourceHighlightBehavior = getChildMeshByName(this.source, CYLINDER_MESH_NAME)!.getBehaviorByName('Highlight') as Nullable<HighlightBehavior>; 
                if (sourceHighlightBehavior) {
                    sourceHighlightBehavior.unhighlightSelf();
                    sourceHighlightBehavior.unhighlightMesh(getChildMeshByName(this.target, CYLINDER_MESH_NAME) as Mesh);
                }    
            }
            this.target = target;
        }

        if (!this.target) {
            this.smoothRotateSource(this.calculateRestingRotation());
            return;
        }

        if (this.#pourable(this.target) && (this.source.getBehaviorByName('PointerDrag') as Nullable<PointerDragBehavior>)?.dragging) {
            const sourceHighlightBehavior = getChildMeshByName(this.source, CYLINDER_MESH_NAME)!.getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
            if (sourceHighlightBehavior) {
                sourceHighlightBehavior.highlightSelf();
                sourceHighlightBehavior.highlightMesh(getChildMeshByName(this.target, CYLINDER_MESH_NAME) as Mesh);
            }
        } else {
            const sourceHighlightBehavior = getChildMeshByName(this.source, CYLINDER_MESH_NAME)!.getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
            if (sourceHighlightBehavior) {
                sourceHighlightBehavior.unhighlightSelf();
                sourceHighlightBehavior.unhighlightMesh(getChildMeshByName(this.target, CYLINDER_MESH_NAME) as Mesh);
            }
        }
        if (this.xr?.state === WebXRState.IN_XR) {
            const sourceBoundingBox = this.source?.getChildMeshes()?.find(mesh => mesh.name === CYLINDER_LIQUID_MESH_NAME)!.getBoundingInfo()?.boundingBox;
            const sourceLocalMinimum = sourceBoundingBox.minimum;
            const sourceLocalMaximum = sourceBoundingBox.maximum;
            const matrix = this.source.computeWorldMatrix();
            const distance = Vector3.Distance(this.source.absolutePosition, this.target.absolutePosition);
            if (distance <= this.sourceRadius && Vector3.TransformCoordinates(sourceLocalMaximum, matrix).y <= Vector3.TransformCoordinates(sourceLocalMinimum, matrix).y) {
                this.#pour(POURING_RATE);
            }
        } else {
            let rotation: Vector3;
            if (this.pouring) {
                rotation = this.calculatePouringRotation(this.target);  // This can set this.pouring
            } else {
                rotation = this.calculateRestingRotation();
            }
            // this.source.rotation = rotation;
            this.smoothRotateSource(rotation);
            if (this.pouring && Math.abs(rotation.z - this.source.rotation.z) < 2 * Math.PI / 36) {  // If the currect z-rotation is within 10 degrees of the current z-rotation
                this.#pour(POURING_RATE);
            }
        }
    }

    #pour = (rate: number): void => {
        if (!this.target) {
            return;
        }
        const sourceLiquidMaterial = getChildMeshByName(this.source, CYLINDER_LIQUID_MESH_NAME)!.material! as StandardMaterial;
        const targetLiquidMaterial = getChildMeshByName(this.target, CYLINDER_LIQUID_MESH_NAME)!.material! as StandardMaterial;
        const sourceAlpha = sourceLiquidMaterial.alpha;
        const targetAlpha = targetLiquidMaterial.alpha;
        const sourceColor = sourceLiquidMaterial.diffuseColor;
        const targetColor = targetLiquidMaterial.diffuseColor;
        if (sourceAlpha > 0) {
            const aInc = Math.min(sourceAlpha, rate);  // Note that we want this to pour even if targetAlpha === 1
            const colorInc = new Color3(Math.min(1 - targetColor.r, sourceColor.r, rate),
                                        Math.min(1 - targetColor.g, sourceColor.g, rate),
                                        Math.min(1 - targetColor.b, sourceColor.b, rate));
            sourceLiquidMaterial.alpha -= aInc;
            targetLiquidMaterial.alpha += Math.min(1 - targetAlpha, aInc);
            sourceLiquidMaterial.diffuseColor = sourceColor.subtract(colorInc);
            targetLiquidMaterial.diffuseColor = targetColor.add(colorInc);
        } else {
            sourceLiquidMaterial.diffuseColor = Color3.Black();
            
            // Complete the relevant task.
            if (this.source.name === 'left-cylinder') {
                sop.completeTask(pourRedCylinderTask);  // This succeeds or fails accordingly and applies the corresponding effects
            }
            else if (this.source.name === 'right-cylinder') {
                sop.completeTask(pourBlueCylinderTask);
            }
        }
    }

    #pourKeyFn = ({ event, type }: KeyboardInfo) => {
        if (event.key === this.pourKey) {
            switch (type) {
                case KeyboardEventTypes.KEYDOWN:
                    const pointerDragBehavior = this.source.behaviors.find(({ name }) => name === 'PointerDrag') as PointerDragBehavior | undefined;
                    if (pointerDragBehavior?.dragging) {
                        this.pouring = true;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    this.pouring = false;
                    break;
            }
        }
    }
}

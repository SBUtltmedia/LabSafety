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

import { CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME, GrabbableAbstractMesh, MAX_POURING_DISTANCE, MS_PER_FRAME, POUR_TIME, ROTATION_RATE } from './constants';
import { pourableTargets } from './globals';
import { getChildMeshByName } from './utils';
import HighlightBehavior from './HighlightBehavior';

// TODO: support setting a custom plane against which to pour. Currently the pouring axis is hardcoded to be the xy-plane.
// TODO: It is hardcoded that the source and target meshes must be cylinders. Fix that.
export default class PouringBehavior implements Behavior<AbstractMesh> {
    target: Nullable<AbstractMesh>;
    sourceRadius: number;
    source!: AbstractMesh;
    targetRotation!: Vector3
    shouldPour!: boolean;
    pouring!: boolean;
    shouldRotate!: boolean;
    rotating!: boolean;
    pourKey = 'e';
    pourIntervalID?: NodeJS.Timer;
    rotationIntervalID?: NodeJS.Timer;
    xr?: WebXRExperienceHelper;
    onStartPour?: (target: AbstractMesh) => void;  // Called immediately before starting pour
    onFinishPour?: (target: AbstractMesh) => void;  // Called immediately before finishing pour (not canceling)

    constructor(sourceRadius: number, xr?: WebXRExperienceHelper, onStartPour?: (target: AbstractMesh) => void, onFinishPour?: (target: AbstractMesh) => void) {
        this.target = null;
        this.sourceRadius = sourceRadius;
        this.xr = xr;
        this.onStartPour = onStartPour;
        this.onFinishPour = onFinishPour;
    }

    get name() {
        return 'Pouring';
    }

    init = () => {
        this.shouldPour = false;
        this.pouring = false;
        this.shouldRotate = false;
        this.rotating = false;
    }
    
    attach = (source: AbstractMesh) => {
        this.source = source;
        this.targetRotation = this.calculateRestingRotation();
        const scene = this.source.getScene();
        scene.onBeforeRenderObservable.add(this.#renderFn);
        scene.onKeyboardObservable.add(this.#pourKeyFn);
        this.#startRotation();
    }

    detach = () => {
        const scene = this.source.getScene();
        scene.onBeforeRenderObservable.removeCallback(this.#renderFn);
        scene.onKeyboardObservable.removeCallback(this.#pourKeyFn);
        this.#cancelPour();
        this.#cancelRotation();
    }

    calculatePouringRotation = (targetMesh: AbstractMesh): Vector3 => {
        const sourceBoundingBox = getChildMeshByName(this.source, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox;
        const liquidMesh = getChildMeshByName(this.source, CYLINDER_LIQUID_MESH_NAME)!;
        const liquidMeshMaterial = liquidMesh.material as StandardMaterial;
        const liquidBoundingBox = liquidMesh.getBoundingInfo().boundingBox;
        const cylinderWidth = sourceBoundingBox.maximum.x - sourceBoundingBox.minimum.x;
        const cylinderHeight = sourceBoundingBox.maximum.y - sourceBoundingBox.minimum.y;
        const liquidHeight = liquidMeshMaterial.alpha * (liquidBoundingBox.maximum.y - liquidBoundingBox.minimum.y);

        const { x, z } = this.source.absolutePosition.subtract(targetMesh.absolutePosition);
        const beta = Math.atan(-z / x) + (x > 0 ? Math.PI : 0);
        const gamma = -Math.atan((2 * (cylinderHeight - liquidHeight)) / cylinderWidth);
        const rotation = new Vector3(0, beta, gamma);
        return rotation;
    }

    #pourable = (target: AbstractMesh): boolean => {
        const sourceCenter = getChildMeshByName(this.source, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox.centerWorld;
        const targetCenter = getChildMeshByName(target, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox.centerWorld;
        const distance = Vector3.Distance(sourceCenter, targetCenter);
        return sourceCenter.y >= getChildMeshByName(target, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox.maximumWorld.y && distance >= this.sourceRadius && distance <= MAX_POURING_DISTANCE;
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

        return targetInfo.mesh;
    }

    calculateRestingRotation = (): Vector3 => {
        if (this.target) {
            const { x, z } = this.source.absolutePosition.subtract(this.target.absolutePosition);
            const beta = Math.atan(-z / x) + (x > 0 ? Math.PI : 0);
            return new Vector3(0, beta, 0);
        } else {
            return Vector3.Zero();
        }
    }

    #renderFn = (): void => {
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
            this.targetRotation.copyFrom(this.calculateTargetRotation());
        }

        if (!this.target) {
            return;
        }

        if (this.#pourable(this.target) && ((this.source.getBehaviorByName('PointerDrag') as Nullable<PointerDragBehavior>)?.dragging || (getChildMeshByName(this.source, CYLINDER_MESH_NAME) as GrabbableAbstractMesh).grabbed)) {
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
            const rotationTolerance = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Math.PI / 4);
            if (this.#rotationWithinTolerance(this.source.absoluteRotationQuaternion.toEulerAngles(), this.calculatePouringRotation(this.target), rotationTolerance)) {
                if (!this.pouring) {
                    this.#startPour();
                }
            } else if (this.pouring) {
                this.#cancelPour();
            }
        } else {
            if (this.shouldPour) {
                const rotationTolerance = new Vector3(Math.PI / 36, Math.PI / 36, Math.PI / 36);
                if (!this.pouring && this.#rotationWithinTolerance(this.source.absoluteRotationQuaternion.toEulerAngles(), this.targetRotation, rotationTolerance)) {  // If the currect z-rotation is within 10 degrees of the current z-rotation.
                    this.#startPour();
                }
            } else if (this.pouring) {
                this.#cancelPour();
            }
        }
    }

    #rotationWithinTolerance = (r1: Vector3, r2: Vector3, tolerance: Vector3): boolean => {
        const diff = r1.subtract(r2);
        return Math.abs(diff.x) <= tolerance.x && Math.abs(diff.y) <= tolerance.y && Math.abs(diff.z) <= tolerance.z;
    }

    calculateTargetRotation = (): Vector3 => {
        return !this.target || !this.shouldPour ? this.calculateRestingRotation() : this.calculatePouringRotation(this.target);
    }

    #startRotation = () => {
        // Note: the rotation approaches the target rotation asymptotically. Don't rely on equality.
        this.rotating = true;
        this.rotationIntervalID = setInterval(() => {
            if (this.xr?.state === WebXRState.IN_XR) {
                if (!(getChildMeshByName(this.source, CYLINDER_MESH_NAME) as GrabbableAbstractMesh).grabbed) {  // TODO: remove cylinder-specific references
                    this.source.rotationQuaternion = null;
                    this.targetRotation.copyFrom(this.calculateTargetRotation());
                    const rotationIncrement = this.targetRotation.subtract(this.source.rotation).scaleInPlace(ROTATION_RATE);
                    this.source.rotation.addInPlace(rotationIncrement);
                }
            } else {
                this.targetRotation.copyFrom(this.calculateTargetRotation());
                const rotationIncrement = this.targetRotation.subtract(this.source.rotation).scaleInPlace(ROTATION_RATE);
                this.source.rotation.addInPlace(rotationIncrement);
            }
        }, MS_PER_FRAME);
    }

    #cancelRotation = () => {
        this.rotating = false;
        clearInterval(this.rotationIntervalID);
    }

    #startPour = () => {
        if (!this.target) {
            return;
        }

        const sourceLiquidMaterial = getChildMeshByName(this.source, CYLINDER_LIQUID_MESH_NAME)!.material! as StandardMaterial;
        if (sourceLiquidMaterial.alpha <= 0) {
            return;
        }
        
        if (this.onStartPour) this.onStartPour(this.target);

        this.pouring = true;
        const targetLiquidMaterial = getChildMeshByName(this.target, CYLINDER_LIQUID_MESH_NAME)!.material! as StandardMaterial;
        const sourceColor = sourceLiquidMaterial.diffuseColor;
        const targetColor = targetLiquidMaterial.diffuseColor;
        
        const alphaPerFrame = MS_PER_FRAME / POUR_TIME;
        const colorIncPerFrame = sourceColor.scale(alphaPerFrame);

        this.pourIntervalID = setInterval(() => {
            if (sourceLiquidMaterial.alpha > 0) {
                sourceLiquidMaterial.alpha -= alphaPerFrame;
                targetLiquidMaterial.alpha += alphaPerFrame;
                const newSourceColor = this.#correctColorBounds(sourceColor.subtract(colorIncPerFrame));
                const newTargetColor = this.#correctColorBounds(targetColor.add(colorIncPerFrame));
                sourceLiquidMaterial.diffuseColor.addToRef(newSourceColor.subtract(sourceLiquidMaterial.diffuseColor), sourceLiquidMaterial.diffuseColor);
                targetLiquidMaterial.diffuseColor.addToRef(newTargetColor.subtract(targetLiquidMaterial.diffuseColor), targetLiquidMaterial.diffuseColor);

                if (sourceLiquidMaterial.alpha < 0) {
                    sourceLiquidMaterial.alpha = 0;
                }
                if (targetLiquidMaterial.alpha > 1) {
                    targetLiquidMaterial.alpha = 1;
                }
            } else {
                // Pouring is finished
                sourceLiquidMaterial.diffuseColor = Color3.Black();
                this.#finishPour();
            }
        }, MS_PER_FRAME);
    }

    #finishPour = () => {
        // TODO: are there concurrency issues with this.target? Is it possible that this.target might be different than it was in #startPour?
        if (this.onFinishPour && this.target) this.onFinishPour(this.target);
        this.#cancelPour();
    }

    #cancelPour = () => {
        clearInterval(this.pourIntervalID);
        this.pouring = false;
    }

    #correctColorBounds = (color: Color3): Color3 => {
        // Works out-of-place
        return new Color3(color.r < 0 ? 0 : color.r > 1 ? 1 : color.r,
                          color.g < 0 ? 0 : color.g > 1 ? 1 : color.g,
                          color.b < 0 ? 0 : color.b > 1 ? 1 : color.b);
    }

    #pourKeyFn = ({ event, type }: KeyboardInfo) => {
        if (event.key === this.pourKey) {
            switch (type) {
                case KeyboardEventTypes.KEYDOWN:
                    const pointerDragBehavior = this.source.behaviors.find(({ name }) => name === 'PointerDrag') as PointerDragBehavior | undefined;
                    if (pointerDragBehavior?.dragging) {
                        this.shouldPour = true;
                        this.shouldRotate = true;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    if (this.shouldPour) {
                        this.shouldPour = false;
                    }
                    break;
            }
        }
    }
}

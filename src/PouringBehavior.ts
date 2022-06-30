import { Behavior } from '@babylonjs/core/Behaviors/behavior';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { KeyboardEventTypes, KeyboardInfo } from '@babylonjs/core/Events/keyboardEvents';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';

// TODO: support setting a custom plane against which to pour. Currently the pouring axis is hardcoded to be the xy-plane.
export default class PouringBehavior implements Behavior<AbstractMesh> {
    target: AbstractMesh;
    sourceRadius: number;
    source!: AbstractMesh;
    pouring!: boolean;
    pourKey = 'e';

    constructor(target: AbstractMesh, sourceRadius: number) {
        this.target = target;
        this.sourceRadius = sourceRadius;
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
        scene.registerBeforeRender(this.#renderFn);
        scene.onKeyboardObservable.add(this.#pourKeyFn);
    }

    detach = () => {
        const scene = this.source.getScene();
        scene.unregisterBeforeRender(this.#renderFn);
        scene.onKeyboardObservable.removeCallback(this.#pourKeyFn);
    }

    calculatePouringRotation = (): Vector3 => {
        const targetCylinderBoundingBox = this.target.getBoundingInfo().boundingBox;
        const xTgt = (targetCylinderBoundingBox.minimumWorld.x + targetCylinderBoundingBox.maximumWorld.x) / 2 - this.source.position.x;
        const yTgt = targetCylinderBoundingBox.maximumWorld.y - this.source.position.y;

        const yTgtNorm = yTgt/Math.hypot(xTgt, yTgt);

        const numerator = xTgt ** 2;
        const denominator = 2 * this.sourceRadius * (Math.asin(yTgtNorm) - this.sourceRadius/2);
        const quotient = numerator/denominator;
        const root = Math.sqrt(Math.abs(quotient));
        const theta = Math.acos(root) + Math.PI/2;  // Note the Math.PI/2 offset.
        if (yTgt > 0 || !Number.isFinite(theta) || Vector3.Distance(new Vector3(xTgt, yTgt, this.target.position.z - this.source.position.z), Vector3.Zero()) < this.sourceRadius) {  // TODO: why is the yTgt > 0 condition necessary?
            if (this.pouring) this.pouring = false;
            return new Vector3(this.source.rotation.x, this.source.rotation.y, 0);
        }
        if (this.source.position.x < this.target.position.x) return new Vector3(0, 0, -theta);
        return new Vector3(0, Math.PI, -theta);
    }

    #renderFn = (): void => {
        // TODO: treat this.pouring better. For example, this.pouring can be true in the beginning of this call but then become false later. Really pouring should only change when it is actually supposed to change.
        this.source.rotationQuaternion = null;
        let rotation: Vector3;
        if (this.pouring) {
            rotation = this.calculatePouringRotation();  // This can set this.pouring
        } else {
            rotation = new Vector3(0, this.source.position.x < this.target.position.x ? 0 : Math.PI, 0);
        }
        this.source.rotation.addInPlace(rotation.subtract(this.source.rotation).scaleInPlace(0.1));  // 0.1 is the velocity factor. TODO: extract this into a parameter.
        if (this.pouring && Math.abs(rotation.z - this.source.rotation.z) < 2 * Math.PI / 36) {  // If the currect z-rotation is within 10 degrees of the current z-rotation
            this.#pour(0.01);  // TODO: 0.01 is a hardcoded rate. Extract this into a parameter.
        }
    }

    #pour = (rate: number): void => {
        const sourceLiquidMaterial = this.source.getChildMeshes().find(mesh => mesh.name === 'liquid')!.material! as StandardMaterial;
        const targetLiquidMaterial = this.target.getChildMeshes().find(mesh => mesh.name === 'liquid')!.material! as StandardMaterial;
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

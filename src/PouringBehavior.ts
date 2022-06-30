import { Behavior } from '@babylonjs/core/Behaviors/behavior';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { KeyboardEventTypes, KeyboardInfo } from '@babylonjs/core/Events/keyboardEvents';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';

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
        if (!Number.isFinite(theta) || Vector3.Distance(new Vector3(xTgt, yTgt, this.target.position.z), this.source.position) < this.sourceRadius) {
            if (this.pouring) this.pouring = false;
            return new Vector3(this.source.rotation.x, this.source.rotation.y, 0);
        }
        if (this.source.position.x < this.target.position.x) return new Vector3(0, 0, -theta);
        return new Vector3(0, Math.PI, -theta);
    }

    #renderFn = (): void => {
        this.source.rotationQuaternion = null;
        let rotation: Vector3;
        if (this.pouring) {
            rotation = this.calculatePouringRotation();
        } else {
            rotation = new Vector3(0, this.source.position.x < this.target.position.x ? 0 : Math.PI, 0);
        }
        this.source.rotation.addInPlace(rotation.subtract(this.source.rotation).scaleInPlace(0.1));  // 0.1 is the velocity factor. TODO: extract this into a parameter.
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

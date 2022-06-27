import { Behavior } from '@babylonjs/core/Behaviors/behavior';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

// TODO: support setting a custom plane against which to pour. Currently the pouring axis is hardcoded to be the xy-plane.
export default class PouringBehavior implements Behavior<AbstractMesh> {
    target: AbstractMesh;
    sourceRadius: number;
    source!: AbstractMesh;
    constructor(target: AbstractMesh, sourceRadius: number) {
        this.target = target;
        this.sourceRadius = sourceRadius;
    }

    get name() {
        return 'Pouring';
    }

    init() {

    }
    
    attach = (source: AbstractMesh) => {
        this.source = source;
        this.#renderFn();
        this.source.getScene().registerBeforeRender(this.#renderFn);
    }

    detach = () => {
        this.source.getScene().unregisterBeforeRender(this.#renderFn);
    }

    calculatePouringRotation = (): Vector3 => {
        const targetCylinderBoundingBox = this.target.getBoundingInfo().boundingBox;
        const xTgt = (targetCylinderBoundingBox.minimumWorld.x + targetCylinderBoundingBox.maximumWorld.x) / 2;
        const yTgt = targetCylinderBoundingBox.maximumWorld.y;

        // Set the center of the pouring cylinder to be the origin. Variables oX and oY are poorly named; they should probably be xTgt and yTgt instead.
        const oX = xTgt - this.source.position.x;
        const oY = yTgt - this.source.position.y;
        // const oXNorm = oX/Math.sqrt(oX**2 + oY**2);
        const oYNorm = oY/Math.sqrt(oX**2 + oY**2);

        const numerator = oX ** 2;
        const denominator = 2 * this.sourceRadius * (Math.asin(oYNorm) - this.sourceRadius/2);
        const quotient = numerator/denominator;  // TODO: why is this negative?
        const root = Math.sqrt(Math.abs(quotient));
        const theta = Math.acos(root) + Math.PI/2;  // Note the Math.PI/2 offset.
        if (!Number.isFinite(theta) || Vector3.Distance(new Vector3(xTgt, yTgt, this.target.position.z), this.source.position) < this.sourceRadius) {
            return new Vector3(this.source.rotation.x, this.source.rotation.y, 0);
        }
        if (this.source.position.x < this.target.position.x) return new Vector3(0, 0, -theta);
        return new Vector3(0, Math.PI, -theta);
    }

    #renderFn = (): void => {
        this.source.rotationQuaternion = null;
        const rotation = this.calculatePouringRotation();
        this.source.rotation.addInPlace(rotation.subtract(this.source.rotation).scaleInPlace(0.1));  // 0.1 is the velocity factor. TODO: extract this into a parameter.
    }
}
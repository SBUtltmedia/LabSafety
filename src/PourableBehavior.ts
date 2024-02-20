import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export class PourableBehavior implements Behavior<Mesh> {
    mesh: Mesh;

    constructor() {

    }

    get name() {
        return "Pourable";
    }

    init() {

    }

    attach = (mesh: Mesh) => {
        this.mesh = mesh;
    }

    detach = () => {

    }

    // Return a position to pour from based on the position of the pouring mesh.
    getPouringPosition = (sourcePosition: Vector3) => {
        if (sourcePosition.x < this.mesh.absolutePosition.x) {
            // Pour from the left
            const pouringPosition = new Vector3(-0.2, 0.3, 0);
            pouringPosition.addInPlace(this.mesh.absolutePosition)
            return pouringPosition;
        } else {
            // Pour from the right
            const pouringPosition = new Vector3(0.2, 0.3, 0);
            pouringPosition.addInPlace(this.mesh.absolutePosition)
            return pouringPosition;
        }
    }
}

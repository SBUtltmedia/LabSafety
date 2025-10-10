import { AbstractMesh, Nullable, Vector3 } from "@babylonjs/core";
import { InteractionMode } from "../managers/interactions/interactionManager";

export class MeshSelector {
    public static getNearestTo(
        mesh: AbstractMesh,
        meshes: AbstractMesh[],
        mode: InteractionMode
    ): Nullable<AbstractMesh> {
        let nearest: Nullable<AbstractMesh> = null;
        let nearestScore = Number.POSITIVE_INFINITY;

        // The logic for desktop/mobile/XR is currently the same, but this structure allows for
        // distinct algorithms in the future if needed.
        for (const neighbor of meshes) {
            const distance = Vector3.Distance(
                mesh.getAbsolutePosition(),
                neighbor.getAbsolutePosition()
            );
            if (distance < nearestScore) {
                nearest = neighbor;
                nearestScore = distance;
            }
        }
        return nearest;
    }
}
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export const COLLIDABLE_MESH_NAMES = ["WallsandFloor", "Floor", "Table", "Roof",
                                      "Countertop", "Walls", "FumehoodBase_LP", "FumehoodInner_LP",
                                      "FumehoodInnerHook_LP"];

export function enableMeshCollisions(roomMesh: Mesh) {
    roomMesh.getChildMeshes().forEach(childMesh => {
        if (COLLIDABLE_MESH_NAMES.includes(childMesh.name)) {
            childMesh.checkCollisions = true;
        }
    });
}

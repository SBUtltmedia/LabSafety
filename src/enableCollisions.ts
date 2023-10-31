import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { COLLIDABLE_MESH_NAMES } from "./Constants";

export function enableMeshCollisions(roomMesh: Mesh) {
    roomMesh.getChildMeshes().forEach(childMesh => {
        if (COLLIDABLE_MESH_NAMES.includes(childMesh.name)) {
            childMesh.checkCollisions = true;
        }
    });
}

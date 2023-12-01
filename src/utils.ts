import { Nullable } from "@babylonjs/core/types";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export function getChildMeshByName(mesh: AbstractMesh, name: string): Nullable<AbstractMesh> {
    return mesh.getChildMeshes().find(mesh => mesh.name === name) || null;
}

export function resetRotation(cylinder) {
    cylinder.rotation.x = 0;
    cylinder.rotation.y = 0;
    cylinder.rotation.z = 0;
}

export function resetPosition(cylinder) {
    cylinder.position.x = 0;
    cylinder.position.y = 0;
    cylinder.position.z = 0;
}

export function log(...data: any[]) {
    if (import.meta.env.DEV) {
        console.log(...data);
    }
}

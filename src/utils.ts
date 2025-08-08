import { Nullable } from "@babylonjs/core/types";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export function getChildMeshByName(mesh: AbstractMesh, name: string): Nullable<AbstractMesh> {
    return mesh.getChildMeshes().find(mesh => mesh.name === name) || null;
}

export function log(...data: any[]) {
    if (import.meta.env.DEV) {
        console.log(...data);
    }
}

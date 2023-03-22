import { AbstractMesh, Nullable, Scene } from "@babylonjs/core";

export function getChildMeshByName(mesh: AbstractMesh, name: string): Nullable<AbstractMesh> {
    return mesh.getChildMeshes().find(mesh => mesh.name === name) || null;
}

// export function checkIfDebug(scene: Scene) {
//     const searchParams = new URLSearchParams(document.location.search);
//     let debug = searchParams.get('debug') === '' || searchParams.get('debug')?.toLowerCase() === 'true';
//     if (debug) {
//         scene.debugLayer.show();
//     }
// }
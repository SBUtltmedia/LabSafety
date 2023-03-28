import { AbstractMesh, Nullable, Scene } from "@babylonjs/core";

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




// export function checkIfDebug(scene: Scene) {
//     const searchParams = new URLSearchParams(document.location.search);
//     let debug = searchParams.get('debug') === '' || searchParams.get('debug')?.toLowerCase() === 'true';
//     if (debug) {
//         scene.debugLayer.show();
//     }
// }
import { AbstractMesh, Mesh, Nullable, Scene, Vector3 } from "@babylonjs/core";

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

export function goToCameraFPS(mesh: Mesh, offset: Vector3 = Vector3.Zero()) {
    mesh.position.x = 0.4 + offset.x;
    mesh.position.y = -0.4 + offset.y;
    mesh.position.z = 1.1 + offset.z;    
}




// export function checkIfDebug(scene: Scene) {
//     const searchParams = new URLSearchParams(document.location.search);
//     let debug = searchParams.get('debug') === '' || searchParams.get('debug')?.toLowerCase() === 'true';
//     if (debug) {
//         scene.debugLayer.show();
//     }
// }
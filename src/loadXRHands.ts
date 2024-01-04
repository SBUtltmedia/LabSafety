import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { loadMeshes } from "./loadMeshes";

export async function loadXRHands(leftHandName: string, rightHandName: string): Promise<Mesh[]> {
    const results = await loadMeshes([leftHandName, rightHandName]);

    let leftHand: Mesh = null;
    let rightHand: Mesh = null;

    for (const handResult of results) {
        const rootMesh = handResult.meshes.find(mesh => mesh.id === leftHandName || mesh.id === rightHandName) as Mesh;

        // Hand animations will play on a loop unless we pause them.
        // Also name animation groups by associated mesh name for
        // later reference.
        for (const animationGroup of handResult.animationGroups) {
            animationGroup.name += `-${rootMesh.name}`;
            animationGroup.pause();
        }

        const [baseMesh] = rootMesh.getChildMeshes() as Mesh[];

        if (!baseMesh) {
            throw new Error(`Cannot collapse the root mesh of ${rootMesh.name}`);
        }
        
        baseMesh.id = rootMesh.id;
        baseMesh.name = rootMesh.name;

        baseMesh.setParent(null);
        rootMesh.dispose(true);

        if (baseMesh.name === leftHandName) {
            leftHand = baseMesh;
        } else if (baseMesh.name === rightHandName) {
            rightHand = baseMesh;
        } else {
            throw new Error("Base mesh name is invalid. This shouldn't be possible.");
        }
    }

    if (!leftHand) {
        throw new Error("No left hand mesh found.");
    }

    if (!rightHand) {
        throw new Error("No right hand mesh found.");
    }

    return [leftHand, rightHand];
}

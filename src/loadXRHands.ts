import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { loadMeshes } from "./loadMeshes";

export async function loadXRHands(leftHandName: XRHandedness, rightHandName: XRHandedness): Promise<Mesh[]> {
    const results = await loadMeshes([leftHandName, rightHandName]);

    // @todo: Error checking, or guarantee these will not be undefined
    let leftHand = results[0].meshes.find(mesh => mesh.id === leftHandName) as Mesh;
    let rightHand = results[1].meshes.find(mesh => mesh.id === rightHandName) as Mesh;
    if (!leftHand) {
        leftHand = results[1].meshes.find(mesh => mesh.id === leftHandName) as Mesh;
        rightHand = results[0].meshes.find(mesh => mesh.id === rightHandName) as Mesh;
    }

    return [leftHand, rightHand];
}

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { loadMeshes } from "./loadMeshes";

export async function loadXRHands(leftHandName: string, rightHandName: string): Promise<Mesh[]> {
    const [leftHandResult, rightHandResult] = await loadMeshes([leftHandName, rightHandName]);

    // @todo: Error checking, or guarantee these will not be undefined
    const leftHand = leftHandResult.meshes.find(mesh => mesh.id === leftHandName) as Mesh;
    const rightHand = rightHandResult.meshes.find(mesh => mesh.id === rightHandName) as Mesh;

    // Hand animations will play on a loop unless we pause them.
    // Also name animation groups by handedness for later reference.
    for (const animationGroup of leftHandResult.animationGroups) {
        animationGroup.name += "-left";
        animationGroup.pause();
    }
    
    for (const animationGroup of rightHandResult.animationGroups) {
        animationGroup.name += "-right";
        animationGroup.pause();
    }

    return [leftHand, rightHand];
}

import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { enableCameraControls } from "./enableCameraControls";
import { enableMeshCollisions } from "./enableCollisions";
import { placeCamera } from "./placeCamera";
import { createBlackboard } from "./Blackboard";

export function createRoom(roomMesh: Mesh) {
    const camera = roomMesh.getScene().activeCamera as UniversalCamera;

    enableMeshCollisions(roomMesh);

    createBlackboard();

    placeCamera(camera);

    // Enable controls here so we have thse room loaded before the user can move around.
    enableCameraControls(camera);
}

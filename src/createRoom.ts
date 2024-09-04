import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { enableCameraControls } from "./enableCameraControls";
import { enableMeshCollisions } from "./enableCollisions";
import { placeCamera } from "./placeCamera";

export function createRoom(roomMesh: Mesh) {

    const camera = roomMesh.getScene().activeCamera as UniversalCamera;

    enableMeshCollisions(roomMesh);

    placeCamera(camera);

    // Enable controls here so we have the room loaded before the user can move around.
    enableCameraControls(camera);
}

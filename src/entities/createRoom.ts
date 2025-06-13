import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { enableCameraControls } from "../systems/enableCameraControls";
import { enableMeshCollisions } from "../systems/enableCollisions";
import { placeCamera } from "../systems/placeCamera";
import { createBlackboard } from "./blackboard";
import { createPortal } from "./createPortal";

export function createRoom(roomMesh: Mesh) {
    const camera = roomMesh.getScene().activeCamera as UniversalCamera;

    enableMeshCollisions(roomMesh);

    createBlackboard();

    createPortal(roomMesh.getScene());

    placeCamera(camera);

    // Enable controls here so we have thse room loaded before the user can move around.
    enableCameraControls(camera);
}

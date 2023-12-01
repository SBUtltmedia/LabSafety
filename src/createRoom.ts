import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { enableCameraControls } from "./enableCameraControls";
import { enableCameraSnappingWorkaround } from "./enableCameraSnappingWorkaround";
import { enableMeshCollisions } from "./enableCollisions";
import { placeCamera } from "./placeCamera";

export function createRoom(roomMesh: Mesh) {
    const camera = roomMesh.getScene().activeCamera as UniversalCamera;

    enableMeshCollisions(roomMesh);

    placeCamera(camera);
    camera.rotationQuaternion = null;
    camera.rotation = new Vector3(Math.PI / 8, 0, 0);

    // Enable controls here so we have the room loaded before the user can move around.
    enableCameraControls(camera);
    enableCameraSnappingWorkaround(camera);
}

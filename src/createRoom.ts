import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { enableMeshCollisions } from "./enableCollisions";
import { placeCamera } from "./placeCamera";
import { enableCameraControls } from "./enableCameraControls";
import { enableCameraSnappingWorkaround } from "./enableCameraSnappingWorkaround";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function createRoom(roomMesh: Mesh) {
    // @todo: re-enable these  
    // fireCabinet = new FireCabinet(mesh);
    // fireExtinguisher.fireCabinetInstance = fireCabinet;
    
    // @todo: Why was this under a conditional for the table mesh existing? Current guess is no reason.
    // let fire = new Fire(scene);
    
    // @todo: What about XR?
    const camera = roomMesh.getScene().activeCamera as UniversalCamera;

    enableMeshCollisions(roomMesh);

    placeCamera(camera);
    camera.rotationQuaternion = null;
    camera.rotation = new Vector3(Math.PI / 8, 0, 0);
    // Enable controls here so we have the room loaded before the user can move around.
    enableCameraControls(camera);
    enableCameraSnappingWorkaround(camera);
}

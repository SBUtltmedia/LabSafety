import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";

export function enableCameraControls(camera: UniversalCamera) {
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D
}

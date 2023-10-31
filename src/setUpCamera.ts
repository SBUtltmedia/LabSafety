import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

//@todo: what about VR?
export function setUpCamera(camera: UniversalCamera): void {
    camera.ellipsoid = new Vector3(0.4, 0.7, 0.4);
    camera.applyGravity = true;
    camera.minZ = 0.0; // To prevent clipping through near meshes
    camera.speed = 0.16;
    camera.checkCollisions = true;
    camera.needMoveForGravity = false;
}

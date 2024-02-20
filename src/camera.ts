import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";

export const STARTING_POSITION = new Vector3(0, 1, -1.134);
export const ELLIPSOID = new Vector3(0.4, 0.7, 0.4);
export const SPEED = 0.16;

export function configureCamera(camera: UniversalCamera): void {
    camera.ellipsoid = ELLIPSOID;
    camera.applyGravity = true;
    camera.minZ = 0.0; // To prevent clipping through near meshes
    camera.speed = SPEED;
    camera.checkCollisions = true;
    camera.needMoveForGravity = false;

}

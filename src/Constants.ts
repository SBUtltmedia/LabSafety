import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { WebXRAbstractMotionController } from "@babylonjs/core/XR/motionController/webXRAbstractMotionController";
import SOP from "./SOP";

export const rootPath = './'
export const RENDER_CANVAS_ID = 'canvas';
export const MAX_XR_GRAB_DISTANCE = 0.25;  // meters
export const BASE_FPS = 60;
export const MS_PER_FRAME = 1000 / 60;  // milliseconds
export const FADE_IN_OUT_TIME = 300;  // milliseconds
export const POUR_TIME = 2000;  // milliseconds
export const ROTATION_RATE = 0.1;  // velocity factor
export const MAX_POURING_DISTANCE = 0.5;
export const TIME_UNTIL_FADE = 50;  // milliseconds
export const NUMBER_OF_CYLINDERS = 3
export const MAX_DISPLACEMENT_PER_FRAME = 0.12;  // If the camera is displaced by more than this in a single frame, the camera won't move at all. Fixes the jumping problem caused by some collisions.

export const FAIL_SOUND_PATH = `${rootPath}sound/mi_explosion_03_hpx.mp3`;
export const SUCCESS_SOUND_PATH = `${rootPath}sound/ding-idea-40142.mp3`;
export const COMPLETION_SOUND_PATH = `${rootPath}sound/456966__funwithsound__success-fanfare-trumpets.mp3`;
export const COMPLETION_RESET_DELAY = 10000;  // milliseconds
export const FAILURE_RESET_DELAY = 5000;  // milliseconds

export const CYLINDER_MESH_NAME = 'cylinder';
export const CYLINDER_LIQUID_MESH_NAME = 'liquid';
export const CYLINDER_A_NAME = 'cylinder-a';
export const CYLINDER_B_NAME = 'cylinder-b';
export const CYLINDER_C_NAME = 'cylinder-c';

export const PLACARD_MESH_NAME = 'placard';
export const sop = new SOP("", "", [{ next: "CtoA", label: "BtoC" },
{ next: "complete", label: "CtoA" },
]);
export interface MotionControllerWithGrab extends WebXRAbstractMotionController {
    //hand: {
    grabbed: boolean,
    meshGrabbed: AbstractMesh,
    //moveDelta: Vector3,
    handID: String,
    lastPosition: Vector3,
    //}
}
export  const  lookupHandModel={"right":"handR2320","left":"handL2320"}
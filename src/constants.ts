import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

export const rootPath = document.location.href.includes('github') ? '' : '../';
export const RENDER_CANVAS_ID = 'renderCanvas';
export const MAX_XR_GRAB_DISTANCE = 0.25;  // meters
export const BASE_FPS = 60;
export const MS_PER_FRAME = 1000 / 60;  // milliseconds
export const FADE_IN_OUT_TIME = 300;  // milliseconds
export const POUR_TIME = 2000;  // milliseconds
export const ROTATION_RATE = 0.1  // velocity factor
export const MAX_POURING_DISTANCE = 0.5;
export const TIME_UNTIL_FADE = 1500;
export const FAIL_SOUND_PATH = `${rootPath}sound/mi_explosion_03_hpx.mp3`;
export const SUCCESS_SOUND_PATH = `${rootPath}sound/ding-idea-40142.mp3`;
export const COMPLETION_SOUND_PATH = `${rootPath}sound/456966__funwithsound__success-fanfare-trumpets.mp3`

export const CYLINDER_MESH_NAME = 'cylinder';
export const CYLINDER_LIQUID_MESH_NAME = 'liquid';
export const CYLINDER_A_NAME = 'cylinder-a';
export const CYLINDER_B_NAME = 'cylinder-b';
export const CYLINDER_C_NAME = 'cylinder-c';

export const PLACARD_MESH_NAME = 'placard';

export interface GrabbableAbstractMesh extends AbstractMesh {
    grabbable: boolean;
}

export interface Task {
    complete: boolean;
    current: boolean;
    title: string;
    shortDescription: string;
    description: string;
}

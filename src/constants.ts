import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

export const rootPath = document.location.href.includes('github') ? '' : '../';
export const RENDER_CANVAS_ID = 'renderCanvas';
export const MAX_XR_GRAB_DISTANCE = 0.25;  // meters
export const BASE_FPS = 60;
export const POURING_RATE = 0.01;  // alpha increment per frame at BASE_FPS fps
export const ROTATION_RATE = 0.1;  // rate of rotation per frame at BASE_FPS fps
export const MAX_POURING_DISTANCE = 0.5;
export const FAIL_SOUND_PATH = `${rootPath}sound/mi_explosion_03_hpx.mp3`;
export const SUCCESS_SOUND_PATH = `${rootPath}sound/ding-idea-40142.mp3`;

export const CYLINDER_MESH_NAME = 'cylinder';
export const CYLINDER_LIQUID_MESH_NAME = 'liquid';

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

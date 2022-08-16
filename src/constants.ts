import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

export const rootPath = document.location.href.includes('github') ? '' : '../';
export const MAX_XR_GRAB_DISTANCE = 0.25;  // meters
export const POURING_RATE = 0.01;  // alpha increment per frame
export const FAIL_SOUND_PATH = `${rootPath}sound/mi_explosion_03_hpx.mp3`;
export const SUCCESS_SOUND_PATH = `${rootPath}sound/ding-idea-40142.mp3`;

export const CYLINDER_MESH_NAME = 'cylinder';
export const CYLINDER_LIQUID_MESH_NAME = 'liquid';

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

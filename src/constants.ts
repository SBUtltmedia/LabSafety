import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
export const modelsPath = `${document.location.href.includes('github') ? '' : '../'}models/`;
export const MAX_XR_GRAB_DISTANCE = 0.25;  // meters
export const POURING_RATE = 0.01;  // alpha increment per frame

export interface GrabbableAbstractMesh extends AbstractMesh {
    grabbable: boolean;
}

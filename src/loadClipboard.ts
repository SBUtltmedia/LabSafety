import { AbstractMesh, Mesh, Scene, Vector3, WebXRDefaultExperience } from "@babylonjs/core";
import FlyToCameraBehavior from "./FlyToCameraBehavior";

/**
 * 
 * @param clipboard The total clipboard mesh
 * @param xrCamera Camera used 
 */

export function createClipboard(clipboard: Mesh, xrCamera: WebXRDefaultExperience) {
    clipboard.name = 'clipboard';
    const scene: Scene = clipboard.getScene();
    const table: AbstractMesh = scene.getMeshByName('Table');
    if (table) {
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        clipboard.position.y = tableBoundingBox.maximumWorld.y + 0.003;
    }
    clipboard.rotationQuaternion = null;
    clipboard.rotation = new Vector3(0, Math.PI / 4, 0);
    const cylinderA = scene.getMeshByName('pivot-Cylinder-A')
    if (cylinderA) {
        clipboard.position.x = cylinderA.position.x + 0.2;
        clipboard.position.z = cylinderA.position.z + 0.5;
    }
    clipboard.addBehavior(new FlyToCameraBehavior(xrCamera.baseExperience));
}
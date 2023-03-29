import { AbstractMesh, Mesh, Scene } from "@babylonjs/core";
import { Cylinder } from "./Cylinder"
import FlyToCameraBehavior from "./FlyToCameraBehavior";

export abstract class Interact {
    cylinderInstances: Array<Cylinder>;
    clipboard: AbstractMesh;
    scene: Scene;

    constructor(cylinderInstances: Array<Cylinder>) {
        this.cylinderInstances = cylinderInstances;
        this.scene = this.cylinderInstances[0].mesh.getScene();
        this.clipboard = this.scene.getMeshByName("clipboard");
        
        const flyToCamera = new FlyToCameraBehavior(xrCamera.baseExperience);
        clipboard.addBehavior(flyToCamera);        
    }

    showSelectedCylinders(cylinderList: Array<Cylinder>, isOn = true) {
        for (let cylinder of cylinderList) {
            cylinder.highlight(isOn);
        }
    }

}
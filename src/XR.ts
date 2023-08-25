import { addXRBehaviors } from "./addXRBehaviors";
import { addWebXR } from "./addWebXR";
import { Scene, WebXRDefaultExperience } from "@babylonjs/core";
import { Cylinder } from "./Cylinder";
import { GUIManager } from "./GUIManager";
import { SoundManager } from "./SoundManager";
import { FireExtinguisher } from "./FireExtinguisher";

export class XR {
    scene: Scene;
    xrCamera: WebXRDefaultExperience;
    addHandModels: any;
    cylinders: Array<Cylinder>;
    guiManager: GUIManager;
    soundManager: SoundManager;
    fireExtinguisher: FireExtinguisher;

    
    constructor(scene: Scene, xrCamera: WebXRDefaultExperience, addHandModles: any, cylinders: Array<Cylinder>,
        guiManager: GUIManager, soundManager: SoundManager, fireExtinguisher: FireExtinguisher) {


        this.scene = scene;
        this.xrCamera = xrCamera;
        this.addHandModels = addHandModles;
        this.cylinders = cylinders;
        this.guiManager = guiManager;
        this.soundManager = soundManager;
        this.fireExtinguisher = fireExtinguisher;

    }


    async addWebXr() {
        return await addWebXR(this.scene, this.xrCamera, this.cylinders);
    }

    addWebXrBehaviors() {
        return addXRBehaviors(this.scene, this.xrCamera, this.addHandModels, this.cylinders,
            this.guiManager, this.soundManager, this.fireExtinguisher);
    }

}
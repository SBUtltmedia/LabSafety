import { addXRBehaviors } from "./addXRBehaviors";
import { addWebXR } from "./addWebXR";
import { Scene, WebXRDefaultExperience } from "@babylonjs/core";
import { Cylinder } from "./Cylinder";
import { GUIManager } from "./GUIManager";
import { SoundManager } from "./SoundManager";

export class XR {
    scene: Scene;
    xrCamera: WebXRDefaultExperience;
    addHandModels: any;
    cylinders: Array<Cylinder>;
    guiManager: GUIManager;
    soundManager: SoundManager;

    
    constructor(scene: Scene, xrCamera: WebXRDefaultExperience, addHandModles: any, cylinders: Array<Cylinder>,
        guiManager: GUIManager, soundManager: SoundManager) {


        this.scene = scene;
        this.xrCamera = xrCamera;
        this.addHandModels = addHandModles;
        this.cylinders = cylinders;
        this.guiManager = guiManager;
        this.soundManager = soundManager;

    }


    async addWebXr() {
        return await addWebXR(this.scene, this.xrCamera, this.cylinders);
    }

    addWebXrBehaviors() {
        return addXRBehaviors(this.scene, this.xrCamera, this.addHandModels, this.cylinders,
            this.guiManager, this.soundManager);
    }

}
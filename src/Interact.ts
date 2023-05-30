import { AbstractMesh, Color3, Color4,
        ParticleSystem, Scene, Sound,
        StandardMaterial, Texture, Vector3,
        WebXRDefaultExperience } from "@babylonjs/core";

import { Cylinder } from "./Cylinder"
import { CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME } from "./Constants";
import { getChildMeshByName } from "./utils";
import { GUIManager } from "./GUIManager";
import { SoundManager } from "./SoundManager";
import { Hand } from "./Hand";

export abstract class Interact {
    cylinderInstances: Array<Cylinder>;
    clipboard: AbstractMesh;
    scene: Scene;
    labels: Array<string>;
    guiManager: GUIManager;
    soundManager: SoundManager;
    xrCamera: WebXRDefaultExperience;

    constructor(scene, cylinderInstances: Array<Cylinder>, guiManager: GUIManager, soundManager: SoundManager, xrCamera: WebXRDefaultExperience) {
        console.log("Cylinders interact: ", cylinderInstances);
        this.labels = ["A", "B", "C"];
        this.scene = scene;
        this.cylinderInstances = cylinderInstances;
        this.guiManager = guiManager;
        this.soundManager = soundManager;
        this.xrCamera = xrCamera;
    }

    getCylinderInstanceFromMesh(cylinder) {
        let name = cylinder.name.split("-")[2];
        for (let instance of this.cylinderInstances) {
            if (instance.name == name) {
                return instance;
            }
        }
        return null;
    }    

    intersectHandCylinder(handMesh) {
        for (let i of this.labels){
             let cylinder = this.scene.getMeshByName(`pivot-Cylinder-${i}`);
             if (handMesh.intersectsMesh(cylinder, false) && cylinder.isPickable) {
                 return cylinder;
             }
         }
         return null;   
    }

    intersectCylinder(sourceCylinder) {
        for (let i of this.labels) {
            let cylinder = this.scene.getMeshByName(`pivot-Cylinder-${i}`);
            if (cylinder == sourceCylinder) continue;
            if (sourceCylinder.intersectsMesh(cylinder)) {
                return cylinder;
            }
        }
        return null;
    }

    highlightAndRotateCylinders(sourceCylinder: Cylinder, targetCylinder: Cylinder, rotationFlag: boolean, hand: Hand = null) {   
        //@ts-ignore
        sourceCylinder.highlight();
        targetCylinder.highlight();

        let current = sourceCylinder.mesh.position;
        let target = targetCylinder.mesh.position;

        sourceCylinder.mesh.rotation.y = 0;

        if (target.x < current.x) { // left hit
            sourceCylinder.mesh.rotation.y = Math.PI;
        }

        targetCylinder.mesh.rotation.y = sourceCylinder.mesh.rotation.y;

        if (!rotationFlag) {
            rotationFlag = true;

            let sizes = sourceCylinder.mesh.getHierarchyBoundingVectors();
            let ySize = sizes.max.y - sizes.min.y;
            let offsetX = 0.1;
            let xPos = target.x;
            let deltaX = current.x - xPos;

            let sourceCylinderMesh = getChildMeshByName(sourceCylinder.mesh, CYLINDER_MESH_NAME);
            let targetCylinderMesh = getChildMeshByName(targetCylinder.mesh, CYLINDER_MESH_NAME);

            if (target.x > current.x) { // right 
                offsetX = -offsetX;
            }

            sourceCylinderMesh.position.x = targetCylinderMesh.position.x + offsetX;
            // sourceCylinderMesh.position.y = ySize - 0.2;
            sourceCylinderMesh.position.y = targetCylinderMesh.position.y + ySize/2;


            if (hand) {
                console.log("HANDDD")
                sourceCylinder.rotateAroundZ(hand);
            } else {
                console.log("NO HAND!!!!")
                sourceCylinder.rotateAroundZ();
            }
        }
        return rotationFlag;
    }

    moveWithCollisions(cylinderMesh: AbstractMesh, delta: Vector3) {
        cylinderMesh.moveWithCollisions(delta);
    }

    addColors(sourceInstance: Cylinder, targetInstance: Cylinder) {
        let sourceColor = sourceInstance.currentColor;
        let targetColor = targetInstance.currentColor;

        let newColor: Color3 = new Color3((sourceColor.r + targetColor.r) / 2, (sourceColor.g + targetColor.g) / 2, (sourceColor.b + targetColor.b) / 2);
        targetInstance.setColor(newColor);        
    }

    showFinishScreen() {
        // this.guiManager.gameFinishPrompt.setVisible(true);
        console.log("XR this: ", this.xrCamera);
        this.guiManager.createPromptWithButton("You have completed the task! The scene will now reset!", this.xrCamera);
    }

    playExplosion() {
        console.log(this.soundManager.loadedSounds["explosion"]);
        let sound: Sound = this.soundManager.loadedSounds["explosion"];
        sound.stop();
        sound.play();
    }

    playDing() {
        let sound: Sound = this.soundManager.loadedSounds["ding"];
        sound.stop();
        sound.play();
    }

    playSuccess() {
        let sound: Sound = this.soundManager.loadedSounds["success"];
        console.log("Success: ", sound);
        sound.stop();
        sound.play();
    }

}
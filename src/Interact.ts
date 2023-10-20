import {
    AbstractMesh, Color3, Color4,
    ParticleSystem, Scene, Sound,
    StandardMaterial, Texture, Vector3,
    WebXRDefaultExperience
} from "@babylonjs/core";

import { Cylinder } from "./Cylinder"
import { CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME, sop } from "./Constants";
import { getChildMeshByName } from "./utils";
import { GUIManager } from "./GUIManager";
import { SoundManager } from "./SoundManager";
import { Hand } from "./Hand";
import { FireCabinet } from "./FireCabinet";
import { FireExtinguisher } from "./FireExtinguisher";

export abstract class Interact {
    cylinderInstances: Array<Cylinder>;
    clipboard: AbstractMesh;
    isRotating: boolean;
    scene: Scene;
    labels: Array<string>;
    guiManager: GUIManager;
    soundManager: SoundManager;
    xrCamera: WebXRDefaultExperience;
    fireExtinguisher: FireExtinguisher;

    constructor(scene, cylinderInstances: Array<Cylinder>, 
        guiManager: GUIManager, soundManager: SoundManager,
         xrCamera: WebXRDefaultExperience,
         fireExtinguisher: FireExtinguisher) {

        this.labels = ["A", "B", "C"];
        this.scene = scene;
        this.cylinderInstances = cylinderInstances;
        this.guiManager = guiManager;
        this.soundManager = soundManager;
        this.xrCamera = xrCamera;
        this.isRotating = false;

        // console.log(fireExtinguisher);

        this.fireExtinguisher = fireExtinguisher;
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
        for (let i of this.labels) {
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

    highlightCylinders(sourceCylinderInstance: Cylinder, targetCylinderInstance: Cylinder) {
        sourceCylinderInstance.highlight();
        targetCylinderInstance.highlight();
    }

    RotateCylinders(sourceCylinderInstance: Cylinder, targetCylinderInstance: Cylinder, hand: Hand = null) {
        //@ts-ignore
            let current = sourceCylinderInstance.mesh.position;
            let target = targetCylinderInstance.mesh.position;

            let animName = "rotateAroundZleft"

            targetCylinderInstance.mesh.rotation.y = sourceCylinderInstance.mesh.rotation.y;

            let sizes = sourceCylinderInstance.mesh.getHierarchyBoundingVectors();
            let ySize = sizes.max.y - sizes.min.y;
            let offsetX = 0.2;
            let xPos = target.x;
            let deltaX = current.x - xPos;

            let sourceCylinderMesh = getChildMeshByName(sourceCylinderInstance.mesh, CYLINDER_MESH_NAME);
            let targetCylinderMesh = getChildMeshByName(targetCylinderInstance.mesh, CYLINDER_MESH_NAME);


            if (target.x < current.x) { // left hit

                // sourceCylinderInstance.mesh.rotation.y = Math.PI;
                sourceCylinderMesh.rotation.y = Math.PI;
            } else {
                // sourceCylinderInstance.mesh.rotation.y = 0;
                sourceCylinderMesh.rotation.y = 0;
                animName = "rotateAroundZright"

                offsetX = -offsetX;
            }

            targetCylinderMesh.rotation.y = sourceCylinderMesh.rotation.y;

            sourceCylinderInstance.mesh.position.x = targetCylinderInstance.mesh.position.x + offsetX;
            sourceCylinderInstance.mesh.position.y = targetCylinderInstance.mesh.position.y + (ySize / 1.5);



            sourceCylinderInstance.rotateAnimation(animName, hand);

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


        for (let cylinder of this.cylinderInstances) {
            cylinder.mesh.isPickable = false;
            cylinder.moveFlag = false;
        }

        function setPickable(instances: Array<Cylinder>) {
            for (let cylinder of instances) {
                cylinder.mesh.isPickable = true;
                cylinder.moveFlag = true;
                cylinder.resetProperties();
                cylinder.showEffects(false);

                setTimeout(() => {
                    cylinder.setColor(cylinder.originalColor);
                }, 1000);

            }
        }

        

        this.guiManager.createPromptWithButton("You have completed the task! The scene will now reset!", this.xrCamera, setPickable, this.cylinderInstances);
    }

    showFailureScreen() {

        for (let cylinder of this.cylinderInstances) {
            cylinder.mesh.isPickable = false;
        }

        function setPickable(instances: Array<Cylinder>) {
            for (let cylinder of instances) {
                cylinder.mesh.isPickable = true;
                cylinder.moveFlag = true;
                cylinder.resetProperties();
                cylinder.showEffects(false);

                setTimeout(() => {
                    cylinder.setColor(cylinder.originalColor);
                }, 1000);

            }
        }

        this.fireExtinguisher.fireCabinetInstance.doorMesh.rotation.y = 0;

        this.guiManager.createPromptWithButton("Task failed! The scene will now reset.", this.xrCamera, setPickable, this.cylinderInstances);
    }

    playExplosion() {

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

        sound.stop();
        sound.play();
    }

}
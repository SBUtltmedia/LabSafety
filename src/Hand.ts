import { Mesh, AbstractMesh, Scene,
        Animation, ParticleSystem, WebXRDefaultExperience,
        Vector3, 
        WebXRState} from "@babylonjs/core";

import { MotionControllerWithGrab, sop } from "./Constants";
import { Cylinder } from "./Cylinder";
import { GUIManager } from "./GUIManager";
import { Interact } from "./Interact";
import { SceneManager } from "./PostSceneCylinderBehavior";
import { SoundManager } from "./SoundManager";

export class Hand extends Interact {
    handedness: string;
    holdingInstance: Cylinder | null;
    holdingMesh: Mesh | AbstractMesh;
    targetMesh: false | AbstractMesh;
    targetMeshInstance: Cylinder | null;
    motionController: MotionControllerWithGrab | null;
    handMesh: Mesh | AbstractMesh;
    isVisible: boolean;
    failBeaker: boolean;
    particleSystem: ParticleSystem;
    cylinderInstancesHand: Cylinder[];

    constructor(handedness: string, scene: Scene, cylinderInstances: Array<Cylinder>, guiManager: GUIManager, soundManager: SoundManager, xrCamera: WebXRDefaultExperience) {
        console.log("Cylinders hand: ", cylinderInstances);
        super(scene, cylinderInstances, guiManager, soundManager, xrCamera);
        this.handedness = handedness;
        this.handMesh = scene.getMeshByName(this.handedness);
        this.isVisible = true;
        this.failBeaker = false;

    }

    getMotionController() {
        return this.motionController;
    }

    setMotionController(motionController: MotionControllerWithGrab) {
        this.motionController = motionController;
    }

    dropped(grabInterval = null){

        console.log(this.holdingInstance.mesh.position, this.holdingInstance.startPos);

        if (Vector3.Distance(this.holdingInstance.mesh.position, this.holdingInstance.startPos) == 0) {
            this.droppedWithoutRespawn();
            return;
        }

        this.motionController.lastPosition = null;

        if (grabInterval)
            clearInterval(grabInterval);

        this.motionController.grabbed = false;
        this.motionController.meshGrabbed = undefined;
        console.log(this.holdingMesh)
    
        if (this.holdingMesh) {
            this.holdingInstance.fadeAndRespawn(100);
            this.holdingMesh = null;
            this.holdingInstance = null;
            this.motionController.meshGrabbed = null;
        }
    }

    droppedWithoutRespawn(){
        this.motionController.lastPosition = null;

        this.motionController.grabbed = false;
        this.motionController.meshGrabbed = undefined;
        console.log(this.holdingMesh)
    
        if (this.holdingMesh) {
            this.holdingMesh = null;
            this.holdingInstance = null;
            this.motionController.meshGrabbed = null;
        }
    }    
    updateSOPTask(from: string, to: string, timeout) {
        console.log(this.scene);
        let fromAndTo = `${from}to${to}`;
        if (sop.tasks[sop.currentState].label === fromAndTo) {
            if (sop.tasks[sop.currentState].next === 'complete') {           
                console.log("GUI mgr", this.guiManager, "Sound mgr: ", this.soundManager);
                let sceneManager = new SceneManager(this.scene, this.cylinderInstances, this.guiManager, this.soundManager, this.xrCamera);
                for (let cylinder of this.cylinderInstances) {
                    cylinder.fadeAndRespawn(100);
                }
                super.playSuccess();

                console.log("Showing finish screen!");

                if (this.xrCamera.baseExperience.state == WebXRState.IN_XR) {
                    super.showFinishScreen();
                    let screen = this.scene.getMeshByName("Start");
                    if (screen) {
                        let camera = this.xrCamera.baseExperience.camera;
                        screen.parent = camera
                        screen.position = camera.position.add(new Vector3(-camera.position.x, -1.5, 1.15));

                        this.xrCamera.pointerSelection.displayLaserPointer = true;
                        this.xrCamera.pointerSelection.displaySelectionMesh = true;

                        // screen.position.x = 0;
                        // screen.position.y = 0;
                        // screen.position.z = 1.65;

                        screen.rotation = Vector3.Zero();
                    }                    
                }

                sop.resetSOP();
                this.disappearAnimation(false);                
                this.dropped(timeout);

                if (this.particleSystem) {
                    this.particleSystem.stop();
                    console.log("Stopping particle system!");
                };

                sceneManager.resetCylinders();
                for (let cylinderInstance of this.cylinderInstances) {
                    cylinderInstance.resetProperties();
                    cylinderInstance.showEffects(false);
                }
                return true;

            } else {
                super.playDing();
                sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
                return false;
            }
        } else {
            if (!this.failBeaker) {
                super.playExplosion();
                this.targetMeshInstance.showEffects(true);
            }
        }
        return false;      
    }    
  

    disappearAnimation(disappear = true) {
        console.log("DISAPPEAR: ", disappear);
        let endFrame = 60;
        let animations = [{ name: 'Invisibility', startValue: 1 }, { name: 'Visibility', startValue: 0 }]
        animations.forEach(animation => {
            animation["init"] = new Animation(animation.name, `visibility`, 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT) 
            animation["init"].setKeys([{ frame: 0, value: animation.startValue }, { frame: endFrame, value: 1 - animation.startValue }])
        });        
        console.log(this.handMesh);
        if (disappear) {
            this.isVisible = false;
            // this.handMesh.visibility = 0.5;
            this.scene.beginDirectAnimation(this.handMesh, [animations[0]["init"]], 0, 60, false);            
        } else {
            this.isVisible = true;
            // this.handMesh.visibility = 1;
            this.scene.beginDirectAnimation(this.handMesh, [animations[1]["init"]], 0, 60, false);            
        }
    }

}
import { Mesh, AbstractMesh, Scene, Animation } from "@babylonjs/core";
import { MotionControllerWithGrab, sop } from "./Constants";
import { Cylinder } from "./Cylinder";
import { GUIManager } from "./GUIManager";
import { Interact } from "./Interact";
import { SceneManager } from "./PostSceneCylinderBehavior";

export class Hand extends Interact {
    handedness: string;
    holdingInstance: Cylinder | null;
    holdingMesh: Mesh | AbstractMesh;
    targetMesh: false | AbstractMesh;
    targetMeshInstance: Cylinder | null;
    motionController: MotionControllerWithGrab | null;
    handMesh: Mesh | AbstractMesh;
    isVisible: boolean;

    constructor(handedness: string, scene: Scene, cylinderInstances: Array<Cylinder>, guiManager: GUIManager) {
        super(scene, cylinderInstances, guiManager);
        this.handedness = handedness;
        this.handMesh = scene.getMeshByName(this.handedness);
        this.isVisible = true;
    }

    getMotionController() {
        return this.motionController;
    }

    setMotionController(motionController: MotionControllerWithGrab) {
        this.motionController = motionController;
    }

    dropped(grabInterval){
        this.motionController.lastPosition = null;
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
        
        // if (!this.isVisible) {
        //     this.disappearAnimation(false);
        // }
    }

    updateSOPTask(from: string, to: string, timeout) {
        console.log(this.scene)
        let fromAndTo = `${from}to${to}`;
        if (sop.tasks[sop.currentState].label === fromAndTo) {
            if (sop.tasks[sop.currentState].next === 'complete') {           
                let sceneManager = new SceneManager(this.scene, this.cylinderInstances, this.guiManager);
                for (let cylinder of this.cylinderInstances) {
                    cylinder.fadeAndRespawn(100);
                }
                sop.resetSOP();
                this.disappearAnimation(false);                
                this.dropped(timeout);
                sceneManager.resetCylinders();
                for (let cylinderInstance of super.cylinderInstances) {
                    cylinderInstance.resetProperties();
                }                
                return true;
            } else {
                sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
                return false;
            }
        }        
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
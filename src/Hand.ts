import { Mesh, AbstractMesh, Scene, Animation, ParticleSystem, Color4, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { CYLINDER_LIQUID_MESH_NAME, MotionControllerWithGrab, sop } from "./Constants";
import { Cylinder } from "./Cylinder";
import { Interact } from "./Interact";
import { SceneManager } from "./PostSceneCylinderBehavior";
import { getChildMeshByName } from "./utils";

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

    constructor(handedness: string, scene: Scene, cylinderInstances: Array<Cylinder>) {
        super(scene, cylinderInstances);
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
            this.targetMesh = null;
            this.targetMeshInstance = null;
        }
    }

    updateSOPTask(from: string, to: string, timeout) {
        console.log(this.scene)
        let fromAndTo = `${from}to${to}`;
        if (sop.tasks[sop.currentState].label === fromAndTo) {
            if (sop.tasks[sop.currentState].next === 'complete') {           
                let sceneManager = new SceneManager(this.scene, super.cylinderInstances);
                for (let cylinder of this.cylinderInstances) {
                    cylinder.fadeAndRespawn(100);
                }
                this.disappearAnimation(false);                
                this.dropped(timeout);
                sceneManager.resetCylinders();
                sop.resetSOP();
                return true;
            }
        } else {
            console.log("Target mesh: ", this.targetMeshInstance);
            sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
            
            // this.targetMeshInstance.startParticles();

            return false;
        }    
    }      
  

    disappearAnimation(disappear = true) {
        console.log("DISAPPEAR: ", disappear);
        let endFrame = 30;
        let animations = [{ name: 'Invisibility', startValue: 1 }, { name: 'Visibility', startValue: 0 }]
        animations.forEach(animation => {
            animation["init"] = new Animation(animation.name, `visibility`, 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT) 
            animation["init"].setKeys([{ frame: 0, value: animation.startValue }, { frame: endFrame, value: 1 - animation.startValue }])
        });        
        console.log(this.handMesh);
        if (disappear) {
            this.isVisible = false;
            // this.handMesh.visibility = 0.5;
            this.scene.beginDirectAnimation(this.handMesh, [animations[0]["init"]], 0, endFrame, false);            
        } else {
            this.isVisible = true;
            // this.handMesh.visibility = 1;
            this.scene.beginDirectAnimation(this.handMesh, [animations[1]["init"]], 0, endFrame, false);            
        }
    }

}
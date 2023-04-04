import { Mesh, AbstractMesh, Scene, Animation } from "@babylonjs/core";
import { MotionControllerWithGrab } from "./Constants";
import { Cylinder } from "./Cylinder";
import { Interact } from "./Interact";

export class Hand extends Interact {
    handedness: string;
    holdingInstance: Cylinder | null;
    holdingMesh: Mesh | AbstractMesh;
    targetMesh: false | AbstractMesh;
    targetMeshInstance: Cylinder | null;
    motionController: MotionControllerWithGrab | null;
    handMesh: Mesh | AbstractMesh;

    constructor(handedness: string, scene: Scene) {
        super(scene);
        this.handedness = handedness;
        this.handMesh = scene.getMeshByName(this.handedness);
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
            // this.handMesh.visibility = 0.5;
            this.scene.beginDirectAnimation(this.handMesh, [animations[0]["init"]], 0, 60, false);            
        } else {
            // this.handMesh.visibility = 1;
            this.scene.beginDirectAnimation(this.handMesh, [animations[1]["init"]], 0, 60, false);            
        }
    }

}
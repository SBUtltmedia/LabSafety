import { Mesh, AbstractMesh, Scene } from "@babylonjs/core";
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

    constructor(handedness: string, scene: Scene) {
        super(scene);
        this.handedness = handedness;
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

}
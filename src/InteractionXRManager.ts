import { AbstractMesh, Observable, Observer, WebXRAbstractMotionController, WebXRDefaultExperience, WebXRInputSource } from "@babylonjs/core";
import { InteractableXRBehavior } from "./InteractableXRBehavior";
import { log } from "./utils";

export enum GrabState {
    GRAB,
    DROP
}

export class InteractionXRManager {
    // @todo: Add something that cleans up Observers if the instance is ever disposed of.
    onGrabStateChangeObservable: Observable<[AbstractMesh, GrabState]>;
    xrExperience: WebXRDefaultExperience;

    constructor(xrExperience: WebXRDefaultExperience) {
        this.xrExperience = xrExperience;

        this.xrExperience.pointerSelection.raySelectionPredicate = function(mesh: AbstractMesh): boolean {
            return Boolean(mesh.getBehaviorByName(InteractableXRBehavior.name));
        };

        this.xrExperience.input.controllers.forEach(this.#setUpController);
        this.xrExperience.input.onControllerAddedObservable.add(this.#setUpController);
        
        this.onGrabStateChangeObservable = new Observable();
    }

    #setUpController = (controller: WebXRInputSource) => {
        if (controller.motionController) {
            this.#setUpMotionController(controller.motionController, controller);
        } else {
            controller.onMotionControllerInitObservable.add(motionController => this.#setUpMotionController(motionController, controller));
        }
    }

    #setUpMotionController = (motionController: WebXRAbstractMotionController, controller: WebXRInputSource) => {
        const squeeze = motionController.getComponentOfType("squeeze");
        if (squeeze) {
            squeeze.onButtonStateChangedObservable.add(() => {
                if (squeeze.changes.pressed) {
                    this.#checkGrab(squeeze.pressed, controller);
                }
            });
        } else {
            log("Squeeze component not found on motion controller.");
        }
    }
    
    #checkGrab = (grab: boolean, controller: WebXRInputSource) => {
        if (grab) {
            const mesh = this.xrExperience.pointerSelection.getMeshUnderPointer(controller.uniqueId);
            if (mesh) {
                this.#notifyMeshObserver(mesh, [controller.pointer, GrabState.GRAB]);
            }
        } else {
            const mesh = controller.pointer.getChildMeshes(false).find(childMesh => childMesh.getBehaviorByName(InteractableXRBehavior.name));
            if (mesh) {
                this.#notifyMeshObserver(mesh, [controller.pointer, GrabState.DROP]);
            }
        }
    }

    #notifyMeshObserver = (mesh: AbstractMesh, data: any) => {
        // Requires that mesh have the InteractableXRBehavior. Not checked because it's for internal use only.
        const behavior = mesh.getBehaviorByName(InteractableXRBehavior.name) as InteractableXRBehavior;
        const observer = behavior.observer;
        this.onGrabStateChangeObservable.notifyObserver(observer, data);
    }
}

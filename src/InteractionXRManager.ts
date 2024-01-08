import { Nullable } from "@babylonjs/core/types";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { WebXRAbstractMotionController } from "@babylonjs/core/XR/motionController/webXRAbstractMotionController";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRInputSource } from "@babylonjs/core/XR/webXRInputSource";

import { InteractableXRBehavior } from "./InteractableXRBehavior";
import { log } from "./utils";

export enum GrabState {
    GRAB,
    DROP
}

export enum ActivationState {
    ACTIVE,
    INACTIVE
}

interface ControllerGrabbedMeshMap {
    [id: string]: Nullable<AbstractMesh>
}

export class InteractionXRManager {
    // @todo: Add something that cleans up Observers if the instance is ever disposed of.
    onGrabStateChangeObservable: Observable<[AbstractMesh, GrabState]> = new Observable();
    onActivationStateChangeObservable: Observable<[Nullable<AbstractMesh>, ActivationState]> = new Observable();
    xrExperience: WebXRDefaultExperience;
    grabbedMeshMap: ControllerGrabbedMeshMap = {};

    constructor(xrExperience: WebXRDefaultExperience) {
        this.xrExperience = xrExperience;
        this.xrExperience.input.controllers.forEach(this.#setUpController);
        this.xrExperience.input.onControllerAddedObservable.add(this.#setUpController);
    }

    #grabPredicate(mesh: AbstractMesh): boolean {
        return mesh.behaviors.some(b => b instanceof InteractableXRBehavior);
    }

    #activatePredicate (mesh: AbstractMesh): boolean {
        const behavior = mesh.behaviors.find(b => b instanceof InteractableXRBehavior) as InteractableXRBehavior;
        return Boolean(behavior) && behavior.activatable;
    }

    #setUpController = (controller: WebXRInputSource) => {
        if (controller.motionController) {
            this.#setUpMotionController(controller.motionController, controller);
        }
        controller.onMotionControllerInitObservable.add(motionController => {
            this.#setUpMotionController(motionController, controller)
        });
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
        const select = motionController.getMainComponent();
        if (select) {
            select.onButtonStateChangedObservable.add(() => {
                if (select.changes.pressed) {
                    this.#checkActivate(select.pressed, controller);
                }
            });
        } else {
            log("Main component not found on motion controller.");
        }
    }
    
    #checkGrab = (grab: boolean, controller: WebXRInputSource) => {
        if (grab) {
            const mesh = this.xrExperience.pointerSelection.getMeshUnderPointer(controller.uniqueId);
            if (mesh && this.#grabPredicate(mesh)) {
                // Check if a controller is already grabbing this mesh
                const currentGrabberID = Object.keys(this.grabbedMeshMap).find(id => this.grabbedMeshMap[id] === mesh);
                if (currentGrabberID) {
                    // Drop mesh already grabbed. This could happen if, for example,
                    // a player swaps which hand is holding the mesh.
                    const currentGrabber = this.xrExperience.input.controllers.find(c => c.uniqueId === currentGrabberID);
                    this.#notifyGrabMeshObserver(mesh, [currentGrabber.grip || currentGrabber.pointer, GrabState.DROP]);
                    this.grabbedMeshMap[currentGrabberID] = null;
                }
                this.grabbedMeshMap[controller.uniqueId] = mesh;
                this.#notifyGrabMeshObserver(mesh, [controller.grip || controller.pointer, GrabState.GRAB]);
            }
        } else {
            if (this.grabbedMeshMap[controller.uniqueId]) {
                this.#notifyGrabMeshObserver(this.grabbedMeshMap[controller.uniqueId], [controller.grip || controller.pointer, GrabState.DROP]);
                this.grabbedMeshMap[controller.uniqueId] = null;
            }
        }
    }

    #checkActivate = (activate: boolean, controller: WebXRInputSource) => {
        const grabbedMesh = this.grabbedMeshMap[controller.uniqueId];
        if (grabbedMesh && this.#activatePredicate(grabbedMesh)) {
            const behavior = grabbedMesh.behaviors.find(b => b instanceof InteractableXRBehavior) as InteractableXRBehavior;
            if (activate) {
                if (behavior.active) {
                    // Stay defensive and deactivate the mesh if it is already active.
                    this.#notifyActivationMeshObserver(grabbedMesh, [null, ActivationState.INACTIVE]);
                }
                this.#notifyActivationMeshObserver(grabbedMesh, [controller.grip || controller.pointer, ActivationState.ACTIVE]);
            } else {
                if (behavior.active) {
                    this.#notifyActivationMeshObserver(grabbedMesh, [null, ActivationState.INACTIVE]);
                }
            }
        }
    }

    #notifyGrabMeshObserver = (mesh: AbstractMesh, data: any) => {
        const behavior = mesh.behaviors.find(b => b instanceof InteractableXRBehavior) as InteractableXRBehavior;
        if (!behavior) {
            throw new Error("InteractionXRManager: mesh must have an instance of InteractableXRBehavior.");
        }
        const observer = behavior.grabObserver;
        this.onGrabStateChangeObservable.notifyObserver(observer, data);
    }

    #notifyActivationMeshObserver = (mesh: AbstractMesh, data: any) => {
        const behavior = mesh.getBehaviorByName(InteractableXRBehavior.name) as InteractableXRBehavior;
        if (!behavior) {
            throw new Error("InteractionXRManager: mesh must have an instance of InteractableXRBehavior.");
        }
        const observer = behavior.activationObserver;
        this.onActivationStateChangeObservable.notifyObserver(observer, data);
    }
}

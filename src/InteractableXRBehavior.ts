import { AbstractMesh, Behavior, Mesh, Observer, Ray, Vector3, WebXRDefaultExperience, WebXRInput } from "@babylonjs/core";
import { InteractionXRManager } from "./InteractionXRManager";
import { GrabState } from "./InteractionXRManager";

export class InteractableXRBehavior implements Behavior<AbstractMesh> {
    // The implementation for interactable behavior in XR. For now, it is
    // intended to be used only in InteractableBehavior to remove some of
    // the burden of implementing functionality from InteractableBehavior.

    mesh: AbstractMesh;
    observer: Observer<[AbstractMesh, GrabState]>;
    interactionManager: InteractionXRManager;

    
    constructor(interactionManager: InteractionXRManager) {
        this.interactionManager = interactionManager;
    }

    static get name() {
        return "InteractableXR";
    }

    get name() {
        return InteractableXRBehavior.name;
    }

    init = () => {

    }

    attach = (mesh: AbstractMesh) => {
        this.mesh = mesh;
        this.observer = this.interactionManager.onGrabStateChangeObservable.add(([pointer, grabState]) => {
            if (grabState === GrabState.GRAB) {
                this.#grab(pointer);
            } else if (grabState === GrabState.DROP) {
                this.#drop(pointer)
            }
        });
    }

    detach = () => {
        this.mesh.setParent(null);
        this.observer.remove();
    }

    #grab = (grabbingMesh: AbstractMesh) => {
        const rootMesh = this.mesh.parent as AbstractMesh;
        rootMesh.setParent(grabbingMesh);
    }

    #drop = (grabbingMesh: AbstractMesh) => {
        const rootMesh = this.mesh.parent as AbstractMesh;
        rootMesh.setParent(null);
    }
}

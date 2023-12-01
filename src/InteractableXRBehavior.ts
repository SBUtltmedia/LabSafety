import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";

import { GrabState, InteractionXRManager } from "./InteractionXRManager";

export class InteractableXRBehavior implements Behavior<AbstractMesh> {
    // The implementation for interactable behavior in XR. Currently, it is
    // intended to be used only in InteractableBehavior to remove some of
    // the burden of implementing functionality from InteractableBehavior.

    mesh: AbstractMesh;
    observer: Observer<[AbstractMesh, GrabState]>;
    interactionManager: InteractionXRManager;
    onGrabStateChangedObservable: Observable<GrabState>;
    #enabled: boolean = true;
    
    constructor(interactionManager: InteractionXRManager) {
        this.interactionManager = interactionManager;
        this.onGrabStateChangedObservable = new Observable();
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
            if (!this.#enabled) {
                return;
            }
            if (grabState === GrabState.GRAB) {
                this.#grab(pointer);
            } else if (grabState === GrabState.DROP) {
                this.#drop();
            }
        });
    }

    detach = () => {
        // @todo: Should this notify observers (by calling this.#drop)?
        this.mesh.setParent(null);
        this.observer.remove();
    }

    #grab = (grabbingMesh: AbstractMesh) => {
        this.mesh.setParent(grabbingMesh);
        this.onGrabStateChangedObservable.notifyObservers(GrabState.GRAB);
    }

    #drop = () => {
        this.mesh.setParent(null);
        this.onGrabStateChangedObservable.notifyObservers(GrabState.DROP);
    }

    get enabled() {
        return this.#enabled;
    }

    disable = () => {
        this.#drop();
        this.#enabled = false;
    }

    enable = () => {
        this.#enabled = true;
    }
}

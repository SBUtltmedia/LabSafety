import { Nullable } from "@babylonjs/core/types";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";

import { ActivationState, GrabState, InteractionXRManager } from "./InteractionXRManager";
import { log } from "./utils";

export class InteractableXRBehavior implements Behavior<AbstractMesh> {
    // The implementation for interactable behavior in XR. Currently, it is
    // intended to be used only in InteractableBehavior to remove some of
    // the burden of implementing functionality from InteractableBehavior.

    mesh: AbstractMesh;
    interactionManager: InteractionXRManager;
    grabObserver: Observer<[AbstractMesh, GrabState]>;
    activationObserver: Observer<[AbstractMesh, ActivationState]>;
    onGrabStateChangedObservable: Observable<[Nullable<AbstractMesh>, GrabState]> = new Observable();
    onActivationStateChangedObservable: Observable<ActivationState> = new Observable();
    #activatable: boolean;
    #enabled: boolean = true;
    #grabbing: boolean = false;
    #active: boolean = false;
    
    constructor(activatable: boolean, interactionManager: InteractionXRManager) {
        this.#activatable = activatable;
        this.interactionManager = interactionManager;
    }

    static get name(): string {
        return "InteractableXR";
    }

    get name(): string {
        return InteractableXRBehavior.name;
    }

    get activatable(): boolean {
        return this.#activatable;
    }

    get active(): boolean {
        return this.#active;
    }

    set activatable(value: boolean) {
        if (!value && this.#active) {
            this.#deactivate();
        }
        this.#activatable = value;
    }

    init = (): void => {

    }

    attach = (mesh: AbstractMesh): void => {
        this.mesh = mesh;
        this.grabObserver = this.interactionManager.onGrabStateChangeObservable.add(([pointer, grabState]) => {
            if (!this.#enabled) {
                return;
            }
            if (grabState === GrabState.GRAB) {
                this.#grab(pointer);
            } else if (grabState === GrabState.DROP) {
                this.#drop();
            }
        });
        this.activationObserver = this.interactionManager.onActivationStateChangeObservable.add(([pointer, activationState]) => {
            if (!this.#enabled || !this.#activatable) {
                return;
            }
            if (activationState === ActivationState.ACTIVE) {
                this.#activate();
            } else if (activationState === ActivationState.INACTIVE) {
                this.#deactivate();
            }
        });
    }

    detach = (): void => {
        if (this.#grabbing) {
            this.#drop();
        }
        if (this.#active) {
            this.#deactivate();
        }
        this.grabObserver.remove();
        this.activationObserver.remove();
    }

    #grab = (grabbingMesh: AbstractMesh): void => {
        this.#grabbing = true;
        this.onGrabStateChangedObservable.notifyObservers([grabbingMesh, GrabState.GRAB]);
    }

    #drop = (): void => {
        // I'm torn about whether deactivation should occur before, after, or mid-drop,
        // so we might want to change this.
        if (this.#active) {
            this.#deactivate();
        }
        this.#grabbing = false;
        this.onGrabStateChangedObservable.notifyObservers([null, GrabState.DROP]);
    }

    #onActivationStart = (): void => {
        log("Start activation");
    }

    #onActivationEnd = (): void => {
        log("End activation");
    }

    #activate = (): void => {
        if (this.#activatable) {
            this.#onActivationStart();
            this.#active = true;
            this.onActivationStateChangedObservable.notifyObservers(ActivationState.ACTIVE);
        }
    }

    #deactivate = (): void => {
        if (this.#activatable) {
            this.#onActivationEnd();
            this.#active = false;
            this.onActivationStateChangedObservable.notifyObservers(ActivationState.INACTIVE);
        }
    }

    get enabled(): boolean {
        return this.#enabled;
    }

    disable = (): void => {
        if (this.#grabbing) {
            this.#drop();
        }
        if (this.#active) {
            this.#deactivate();
        }
        this.#enabled = false;
    }

    enable = (): void => {
        this.#enabled = true;
    }
}

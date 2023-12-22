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
    onGrabStateChangedObservable: Observable<GrabState> = new Observable();
    onActivationStateChangedObservable: Observable<ActivationState> = new Observable();
    #activatable: boolean;
    protected _enabled: boolean = true;
    protected _grabbing: boolean = false;
    protected _active: boolean = false;
    
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
        return this._active;
    }

    set activatable(value: boolean) {
        if (!value && this._active) {
            this._deactivate();
        }
        this.#activatable = value;
    }

    init = (): void => {

    }

    attach = (mesh: AbstractMesh): void => {
        this.mesh = mesh;
        this.grabObserver = this.interactionManager.onGrabStateChangeObservable.add(([pointer, grabState]) => {
            if (!this._enabled) {
                return;
            }
            if (grabState === GrabState.GRAB) {
                this._grab(pointer);
            } else if (grabState === GrabState.DROP) {
                this._drop();
            }
        });
        this.activationObserver = this.interactionManager.onActivationStateChangeObservable.add(([pointer, activationState]) => {
            if (!this._enabled || !this.#activatable) {
                return;
            }
            if (activationState === ActivationState.ACTIVE) {
                this._activate();
            } else if (activationState === ActivationState.INACTIVE) {
                this._deactivate();
            }
        });
    }

    detach = (): void => {
        if (this._grabbing) {
            this._drop();
        }
        this.grabObserver.remove();
    }

    protected _onGrabStart = (grabbingMesh: AbstractMesh): void => {
        this.mesh.setParent(grabbingMesh);
    }

    protected _onGrabEnd = (): void => {
        this.mesh.setParent(null);
    }

    protected _grab = (grabbingMesh: AbstractMesh): void => {
        this._onGrabStart(grabbingMesh);
        this._grabbing = true;
        this.onGrabStateChangedObservable.notifyObservers(GrabState.GRAB);
    }

    protected _drop = (): void => {
        // I'm torn about whether deactivation should occur before, after, or mid-drop,
        // so we might want to change this.
        if (this._active) {
            this._deactivate();
        }
        this._onGrabEnd();
        this._grabbing = false;
        this.onGrabStateChangedObservable.notifyObservers(GrabState.DROP);
    }

    protected _onActivationStart = (): void => {
        log("Start activation");
    }

    protected _onActivationEnd = (): void => {
        log("End activation");
    }

    protected _activate = (): void => {
        if (this.#activatable) {
            this._onActivationStart();
            this._active = true;
            this.onActivationStateChangedObservable.notifyObservers(ActivationState.ACTIVE);
        }
    }

    protected _deactivate = (): void => {
        if (this.#activatable) {
            this._onActivationEnd();
            this._active = false;
            this.onActivationStateChangedObservable.notifyObservers(ActivationState.INACTIVE);
        }
    }

    get enabled(): boolean {
        return this._enabled;
    }

    disable = (): void => {
        if (this._grabbing) {
            this._drop();
        }
        // this._active implies this.#activatable, so we don't need to check this.#activatable.
        if (this._active) {
            this._deactivate();
        }
        this._enabled = false;
    }

    enable = (): void => {
        this._enabled = true;
    }
}

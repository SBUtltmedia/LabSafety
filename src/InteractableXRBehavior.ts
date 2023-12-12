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
    onGrabStateChangedObservable: Observable<GrabState> = new Observable();
    protected _enabled: boolean = true;
    protected _grabbing: boolean = false;
    
    constructor(interactionManager: InteractionXRManager) {
        this.interactionManager = interactionManager;
    }

    static get name(): string {
        return "InteractableXR";
    }

    get name(): string {
        return InteractableXRBehavior.name;
    }

    init = (): void => {

    }

    attach = (mesh: AbstractMesh): void => {
        this.mesh = mesh;
        this.observer = this.interactionManager.onGrabStateChangeObservable.add(([pointer, grabState]) => {
            if (!this._enabled) {
                return;
            }
            if (grabState === GrabState.GRAB) {
                this._grab(pointer);
            } else if (grabState === GrabState.DROP) {
                this._drop();
            }
        });
    }

    detach = (): void => {
        if (this._grabbing) {
            this._drop();
        }
        this.observer.remove();
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
        this._onGrabEnd();
        this._grabbing = false;
        this.onGrabStateChangedObservable.notifyObservers(GrabState.DROP);
    }

    get enabled(): boolean {
        return this._enabled;
    }

    disable = (): void => {
        if (this._grabbing) {
            this._drop();
        }
        this._enabled = false;
    }

    enable = (): void => {
        this._enabled = true;
    }
}

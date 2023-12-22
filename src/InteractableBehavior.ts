import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRState } from "@babylonjs/core/XR/webXRTypes";

import { InteractableXRBehavior } from "./InteractableXRBehavior";
import { ActivationState, GrabState, InteractionXRManager } from "./InteractionXRManager";
import { log } from "./utils";

export class InteractableBehavior implements Behavior<Mesh> {
    // If we want desktop mode to be a first-class platform, I feel strongly that camera controls should not
    // be disabled during a drag. Currently, this is not implemented.

    mesh: Mesh;
    #currentBehavior?: Behavior<Mesh>;
    #xrInteractionManager?: InteractionXRManager;
    #xrExperience?: WebXRDefaultExperience;
    #xrStateObserver?: Observer<WebXRState>;
    #grabStateObservers: Observer<any>[] = [];
    #activationStateObservers: Observer<any>[] = [];
    onGrabStateChangedObservable: Observable<GrabState> = new Observable();
    onActivationStateChangedObservable: Observable<ActivationState> = new Observable();
    #grabState: GrabState = GrabState.DROP;
    #activationState: ActivationState = ActivationState.INACTIVE;
    targets: AbstractMesh[];
    // @todo: Currently does nothing for desktop, because I don't know how we should handle it.
    #activatable: boolean;
    
    constructor(activatable: boolean = false, xrInteractionManager?: InteractionXRManager) {
        this.#activatable = activatable;
        if (xrInteractionManager) {
            this.#xrInteractionManager = xrInteractionManager;
            this.#xrExperience = this.#xrInteractionManager.xrExperience;
        }
        this.targets = [];
    }

    get name() {
        return "Interactable";
    }

    get activatable(): boolean {
        return this.#activatable;
    }

    set activatable(value: boolean) {
        // The `as any` assertion effectively ignores TypeScript. I don't love this, but it's
        // the easiest way to check for existence of activatable without the compiler
        // complaining. It should be safe since we check the type of activatable first.
        // Note that Object.hasOwn will NOT work for this, since activatable is defined
        // by accessors.
        const behavior = this.#currentBehavior as any;
        if (typeof behavior.activatable === "boolean") {
            behavior.activatable = value;
        }
        this.#activatable = value;
    }

    get activationState(): ActivationState {
        return this.#activationState;
    }

    get grabState(): GrabState {
        return this.#grabState;
    }

    init = () => {

    }

    attach = (mesh: Mesh) => {
        this.mesh = mesh;
        let state: WebXRState;
        if (this.#xrExperience) {
            this.#xrStateObserver = this.#xrExperience.baseExperience.onStateChangedObservable.add(this.#switchMode);
            state = this.#xrExperience.baseExperience.state;
        } else {
            state = WebXRState.NOT_IN_XR;
        }
        this.#switchMode(state);
    }

    detach = () => {
        if (this.#currentBehavior) {
            this.mesh.removeBehavior(this.#currentBehavior);
        }

        while (this.#grabStateObservers.length) {
            this.#grabStateObservers.pop().remove();
        }

        while (this.#activationStateObservers.length) {
            this.#activationStateObservers.pop().remove();
        }
        
        this.#xrStateObserver?.remove();
    }

    #switchMode = (state: WebXRState) => {
        switch (state) {
            case WebXRState.IN_XR:
                if (this.#xrInteractionManager) {
                    const xrBehavior = new InteractableXRBehavior(this.#activatable, this.#xrInteractionManager);
                    
                    this.#changeBehavior(xrBehavior);
                    
                    this.#grabStateObservers.push(xrBehavior.onGrabStateChangedObservable.add(grabState => {
                        this.#grabState = grabState;
                        this.onGrabStateChangedObservable.notifyObservers(grabState);
                    }));
                    this.#activationStateObservers.push(xrBehavior.onActivationStateChangedObservable.add(activationState => {
                        this.#activationState = activationState;
                        this.onActivationStateChangedObservable.notifyObservers(activationState);
                    }));
                } else {
                    log("InteractableBehavior: attempted to switch mode to XR without an XR interaction manager.");
                }
                break;
            case WebXRState.NOT_IN_XR:
                const desktopBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) });

                this.#changeBehavior(desktopBehavior);
                
                this.#grabStateObservers.push(desktopBehavior.onDragStartObservable.add(() => {
                    this.#grabState = GrabState.GRAB;
                    this.onGrabStateChangedObservable.notifyObservers(GrabState.GRAB);
                }));
                this.#grabStateObservers.push(desktopBehavior.onDragEndObservable.add(() => {
                    this.#grabState = GrabState.DROP;
                    this.onGrabStateChangedObservable.notifyObservers(GrabState.DROP);
                }));
                break;
        }
    }

    #changeBehavior = (newBehavior: Behavior<Mesh>): Mesh => {
        if (this.#currentBehavior) {
            this.mesh.removeBehavior(this.#currentBehavior);
            while (this.#grabStateObservers.length) {
                this.#grabStateObservers.pop().remove();
            }
            while (this.#activationStateObservers.length) {
                this.#activationStateObservers.pop().remove();
            }
        }
        this.#currentBehavior = newBehavior;
        return this.mesh.addBehavior(this.#currentBehavior) as Mesh;
    }

    disable = () => {
        if (this.#currentBehavior instanceof InteractableXRBehavior) {
            (this.#currentBehavior as InteractableXRBehavior).disable();
        } else if (this.#currentBehavior.name === "PointerDrag") {
            (this.#currentBehavior as PointerDragBehavior).releaseDrag();
            (this.#currentBehavior as PointerDragBehavior).enabled = false;
        }
    }

    enable = () => {
        if (this.#currentBehavior instanceof InteractableXRBehavior) {
            (this.#currentBehavior as InteractableXRBehavior).enable();
        } else if (this.#currentBehavior.name === "PointerDrag") {
            (this.#currentBehavior as PointerDragBehavior).enabled = true;
        }
    }
}

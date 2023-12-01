import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRState } from "@babylonjs/core/XR/webXRTypes";

import { InteractableXRBehavior } from "./InteractableXRBehavior";
import { GrabState, InteractionXRManager } from "./InteractionXRManager";
import { log } from "./utils";

export class InteractableBehavior implements Behavior<Mesh> {
    // If we want desktop mode to be a first-class platform, I feel strongly that camera controls should not
    // be disabled during a drag. Currently, this is not implemented.

    mesh: Mesh;
    #currentBehavior?: Behavior<Mesh>;
    #xrInteractionManager?: InteractionXRManager;
    #xrExperience?: WebXRDefaultExperience;
    #xrStateObserver?: Observer<WebXRState>;
    #grabStateObservers: Observer<any>[];
    onGrabStateChangedObservable: Observable<GrabState>;
    grabState: GrabState;
    targets: AbstractMesh[];
    
    constructor(xrInteractionManager?: InteractionXRManager) {
        if (xrInteractionManager) {
            this.#xrInteractionManager = xrInteractionManager;
            this.#xrExperience = this.#xrInteractionManager.xrExperience;
        }
        this.onGrabStateChangedObservable = new Observable();
        this.#grabStateObservers = [];
        this.targets = [];
    }

    get name() {
        return "Interactable";
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
        
        this.#xrStateObserver?.remove();
    }

    #switchMode = (state: WebXRState) => {
        switch (state) {
            case WebXRState.IN_XR:
                if (this.#xrInteractionManager) {
                    const xrBehavior = new InteractableXRBehavior(this.#xrInteractionManager);
                    
                    this.#changeBehavior(xrBehavior);
                    
                    this.#grabStateObservers.push(xrBehavior.onGrabStateChangedObservable.add(grabState => {
                        this.grabState = grabState;
                        this.onGrabStateChangedObservable.notifyObservers(grabState);
                    }));
                } else {
                    log("InteractableBehavior: attempted to switch mode to XR without an XR interaction manager.");
                }
                break;
            case WebXRState.NOT_IN_XR:
                const desktopBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) });

                this.#changeBehavior(desktopBehavior);
                
                this.#grabStateObservers.push(desktopBehavior.onDragStartObservable.add(() => {
                    this.grabState = GrabState.GRAB;
                    this.onGrabStateChangedObservable.notifyObservers(GrabState.GRAB);
                }));
                this.#grabStateObservers.push(desktopBehavior.onDragEndObservable.add(() => {
                    this.grabState = GrabState.DROP;
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
        }
        this.#currentBehavior = newBehavior;
        return this.mesh.addBehavior(this.#currentBehavior) as Mesh;
    }

    disable = () => {
        if (this.#currentBehavior.name === InteractableXRBehavior.name) {
            (this.#currentBehavior as InteractableXRBehavior).disable();
        } else if (this.#currentBehavior.name === "PointerDrag") {
            log("Disabling " + PointerDragBehavior.name);
            (this.#currentBehavior as PointerDragBehavior).releaseDrag();
            (this.#currentBehavior as PointerDragBehavior).enabled = false;
        }
    }

    enable = () => {
        if (this.#currentBehavior.name === InteractableXRBehavior.name) {
            (this.#currentBehavior as InteractableXRBehavior).enable();
        } else if (this.#currentBehavior.name === "PointerDrag") {
            log("Disabling " + PointerDragBehavior.name);
            (this.#currentBehavior as PointerDragBehavior).enabled = true;
        }
    }
}

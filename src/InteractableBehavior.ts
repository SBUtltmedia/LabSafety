import { WebXRState } from "@babylonjs/core/XR/webXRTypes";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { Observer, PointerDragBehavior, SixDofDragBehavior, Vector3 } from "@babylonjs/core";
import { log } from "./utils";
import { InteractableXRBehavior } from "./InteractableXRBehavior";
import { InteractionXRManager } from "./InteractionXRManager";

export class InteractableBehavior implements Behavior<Mesh> {
    // If we want desktop mode to be a first-class platform, I feel strongly that camera controls should not
    // be disabled during a drag. Currently, this is not implemented.

    mesh: Mesh;
    #currentBehavior?: Behavior<Mesh>;
    #xrInteractionManager?: InteractionXRManager;
    #xrExperience?: WebXRDefaultExperience;
    #xrStateObserver?: Observer<WebXRState>;
    
    constructor(xrInteractionManager?: InteractionXRManager) {
        if (xrInteractionManager) {
            this.#xrInteractionManager = xrInteractionManager;
            this.#xrExperience = this.#xrInteractionManager.xrExperience;
        }
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
        this.#xrStateObserver?.remove();
    }

    #switchMode = (state: WebXRState) => {
        switch (state) {
            case WebXRState.IN_XR:
                if (this.#xrInteractionManager) {
                    const xrBehavior = new InteractableXRBehavior(this.#xrInteractionManager);
                    this.#changeBehavior(xrBehavior);
                } else {
                    log("InteractableBehavior: attempted to switch mode to XR without an XR interaction manager.");
                }
                break;
            case WebXRState.NOT_IN_XR:
                const desktopBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) });
                this.#changeBehavior(desktopBehavior);
                break;
        }
    }

    #changeBehavior = (newBehavior: Behavior<Mesh>): Mesh => {
        if (this.#currentBehavior) {
            this.mesh.removeBehavior(this.#currentBehavior);
        }
        this.#currentBehavior = newBehavior;
        return this.mesh.addBehavior(this.#currentBehavior) as Mesh;
    }
}
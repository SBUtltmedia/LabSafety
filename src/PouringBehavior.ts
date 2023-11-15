import { Behavior, Color3, Mesh, Nullable, Observer, Scene, Vector3 } from "@babylonjs/core";
import { InteractableBehavior } from "./InteractableBehavior";
import { HighlightBehavior } from "./HighlightBehavior";
import { GrabState, InteractionXRManager } from "./InteractionXRManager";

// Works with InteractableBehavior and HighlightBehavior to determine
// when to pour and indicate to the user when a pour is possible.

// @todo: Should this instantiate InteractableBehavior and HighlightBehavior itself,
// like InteractableBehavior does with InteractableXRBehavior and PointerDragBehavior?
// Possibly.
export class PouringBehavior implements Behavior<Mesh> {
    mesh: Mesh;
    #interactableBehavior: InteractableBehavior;
    #highlightBehavior: HighlightBehavior;
    #grabStateObserver: Observer<GrabState>;
    #renderObserver: Nullable<Observer<Scene>>;
    #currentTarget: Nullable<Mesh>;
    
    constructor(targets: Mesh[], interactionXRManager?: InteractionXRManager) {
        this.#interactableBehavior = new InteractableBehavior(interactionXRManager || undefined);
        this.#interactableBehavior.targets.push(...targets);
        this.#highlightBehavior = new HighlightBehavior(Color3.Green());
    }

    static get name() {
        return "Pouring";
    }

    get name() {
        return "Pouring";
    }

    init() {

    }

    attach = (mesh: Mesh) => {
        this.mesh = mesh;
        
        this.mesh.addBehavior(this.#interactableBehavior);
        this.mesh.addBehavior(this.#highlightBehavior);

        const scene = mesh.getScene();
        const targets = this.#interactableBehavior.targets as Mesh[];
        this.#grabStateObserver = this.#interactableBehavior.onGrabStateChangedObservable.add(grabState => {
            if (grabState === GrabState.GRAB) {
                this.#renderObserver = scene.onBeforeRenderObservable.add(() => {
                    const target = this.#checkNearTarget(targets);
                    this.#changeTarget(target);
                });
            } else if (grabState === GrabState.DROP) {
                this.#changeTarget(null);
                this.#renderObserver.remove();
                this.#renderObserver = null;
            }
        });
    }

    detach = () => {
        this.#grabStateObserver.remove();
        if (this.#renderObserver) {
            this.#renderObserver.remove();
        }
    }

    #checkNearTarget(targets: Mesh[]): Nullable<Mesh> {
        const validTargets = targets.filter(target => this.mesh.absolutePosition.y > target.absolutePosition.y && this.mesh.intersectsMesh(target));

        let bestTarget = null;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const target of validTargets) {
            const distance = Vector3.Distance(this.mesh.absolutePosition, target.absolutePosition);
            if (distance < bestDistance) {
                bestTarget = target;
                bestDistance = distance;
            }
        }

        return bestTarget;
    }

    #changeTarget(target: Nullable<Mesh>) {
        if (this.#currentTarget === target) {
            return;
        }

        if (this.#currentTarget) {
            this.#highlightBehavior.unhighlightAll();
        }

        if (target) {
            this.#highlightBehavior.highlightSelf();
            this.#highlightBehavior.highlightOther(target);
        }

        this.#currentTarget = target;
    }
}

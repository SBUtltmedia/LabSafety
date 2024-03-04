import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";

import { HighlightBehavior } from "./HighlightBehavior";
import { InteractableBehavior } from "./interactableBehavior";
import { ActivationState, GrabState, IActivationInfo, IGrabInfo, InteractionMode } from "./interactionManager";
import { GameStateBehavior, GameStates } from "./GameStateBehavior";

// Works with InteractableBehavior and HighlightBehavior to determine
// when to pour and indicate to the user when a pour is possible.

export class PouringBehavior implements Behavior<Mesh> {
    mesh: Mesh;
    #interactableBehavior: InteractableBehavior;
    #highlightBehavior: HighlightBehavior;
    #grabStateObserver: Observer<IGrabInfo>;
    #activationStateObserver: Nullable<Observer<IActivationInfo>> = null;
    #renderObserver: Nullable<Observer<Scene>>;
    #currentTarget: Nullable<AbstractMesh>;
    onBeforePourObservable: Observable<AbstractMesh>;
    onMidPourObservable: Observable<AbstractMesh>;
    onAfterPourObservable: Observable<AbstractMesh>;
    liquidMesh?: AbstractMesh; // If this is set, setting empty to true will make this mesh invisible, and setting empty to false will make it visible.
    #empty: boolean = false;
    pourDelay: number = 1000;
    animating: boolean = false;
    onAnimationChangeObservable: Observable<Boolean>;
    
    constructor() {
        this.#highlightBehavior = new HighlightBehavior(Color3.Green());
        this.onBeforePourObservable = new Observable();
        this.onMidPourObservable = new Observable();
        this.onAfterPourObservable = new Observable();
        this.onAnimationChangeObservable = new Observable();
    }

    get name() {
        return "Pouring";
    }

    init() {

    }

    attach = (mesh: Mesh) => {
        this.mesh = mesh;
        this.#interactableBehavior = this.mesh.getBehaviorByName("Interactable") as InteractableBehavior;
        if (!this.#interactableBehavior) {
            throw new Error(`${this.name} behavior must have Interactable present on the same mesh.`);
        }
        this.mesh.addBehavior(this.#highlightBehavior);

        const scene = mesh.getScene();
        const camera = scene.activeCamera;
        const targets = this.#interactableBehavior.interactionManager.interactableMeshes as AbstractMesh[];
        this.#grabStateObserver = this.#interactableBehavior.onGrabStateChangedObservable.add(({ state }) => {
            if (state === GrabState.GRAB) {
                (camera.getBehaviorByName("StateMachine") as GameStateBehavior).onStateChangeObervable.notifyObservers(GameStates.GAME_STATE_PICK_CYLINDER);
                this.#renderObserver = scene.onBeforeRenderObservable.add(() => {
                    const target = this.#checkNearTarget(targets);
                    this.#changeTarget(target);
                });
            } else if (state === GrabState.DROP) {
                this.#changeTarget(null);
                (camera.getBehaviorByName("StateMachine") as GameStateBehavior).onStateChangeObervable.notifyObservers(GameStates.GAME_STATE_DROP_CYLINDER);
                // The conditional is necessary because a DROP can be received without a corresponding GRAB.
                // An example is when the cylinder is automatically dropped when a pour occurs and the user
                // subsequently releases the squeeze, triggering another drop.
                if (this.#renderObserver) {
                    this.#renderObserver.remove();
                    this.#renderObserver = null;
                }
            }
        });

        let tilted = false;
        this.#activationStateObserver = this.#interactableBehavior.onActivationStateChangedObservable.add(({ state }) => {
            if (state === ActivationState.ACTIVE && !this.#empty && this.#currentTarget) {
                const mode = this.#interactableBehavior.interactionManager.interactionMode
                if (mode === InteractionMode.DESKTOP || mode === InteractionMode.MOBILE) {
                    this.mesh.rotation.z += Math.PI / 4;
                    tilted = true;
                }
                this.pour();
            } else if (state === ActivationState.INACTIVE && tilted) {
                this.mesh.rotation.z -= Math.PI / 4;
                tilted = false;
            }
        });
    }

    detach = () => {
        this.#grabStateObserver.remove();
        this.#activationStateObserver.remove();
        if (this.#renderObserver) {
            this.#renderObserver.remove();
        }
    }

    get empty(): boolean {
        return this.#empty;
    }

    set empty(value: boolean) {
        if (this.#empty && !value) {
            if (this.liquidMesh) {
                this.liquidMesh.isVisible = true;
            }
            this.#empty = value;
        } else if (!this.#empty && value) {
            if (this.liquidMesh) {
                this.liquidMesh.isVisible = false;
            }
            this.#empty = value;
        }
    }

    #checkNearTarget(targets: AbstractMesh[]): Nullable<AbstractMesh> {
        const validTargets = targets.filter(target => {
            const isTargetBelow = this.mesh.absolutePosition.y > target.absolutePosition.y;
            const isPourable = Boolean(target.getBehaviorByName("Pouring"));
            const targetNotGrabbed = !(target.getBehaviorByName("Interactable") as InteractableBehavior).grabbing;
            const intersectingTarget = this.mesh.intersectsMesh(target);
            return isTargetBelow && isPourable && targetNotGrabbed && intersectingTarget;
        });

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

    #changeTarget(target: Nullable<AbstractMesh>) {
        if (this.#currentTarget === target) {
            return;
        }

        if (this.#currentTarget) {
            if (this.#currentTarget instanceof Mesh) {
                this.#highlightBehavior.unhighlightAll();
            }
        }

        this.#currentTarget = target;
        
        if (this.#currentTarget) {
            if (this.#currentTarget instanceof Mesh) {
                this.#highlightBehavior.highlightSelf();
                this.#highlightBehavior.highlightOther(this.#currentTarget);
            }
        }
    }

    pour = () => {
        if (!this.#currentTarget) {
            throw new Error("PouringBehavior: attempted pour with no current target.");
        }
        const pouringBehavior = this.#currentTarget.getBehaviorByName("Pouring") as PouringBehavior;
        if (!pouringBehavior) {
            throw new Error("PouringBehavior: target is not pourable.");
        }

        pouringBehavior.empty = false;

        const target = this.#currentTarget;
        this.onBeforePourObservable.notifyObservers(target);
        this.onMidPourObservable.notifyObservers(target);
        this.onAfterPourObservable.notifyObservers(target);
        this.empty = true;
    }
}

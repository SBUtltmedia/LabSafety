import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Animation } from "@babylonjs/core/Animations/animation";
import { IAnimationKey } from "@babylonjs/core/Animations/animationKey";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";

import { HighlightBehavior } from "./HighlightBehavior";
import { InteractableBehavior } from "./interactableBehavior";
import { ActivationState, GrabState, IActivationInfo, IGrabInfo, InteractionManager } from "./interactionManager";
import { PourableBehavior } from "./PourableBehavior";

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
    pourDelay: number = 1000;
    animating: boolean = false;
    onAnimationChangeObservable: Observable<Boolean>;
    
    constructor(interactionManager: InteractionManager) {
        this.#interactableBehavior = new InteractableBehavior(interactionManager, {
            activatable: true,
            defaultRotation: new Vector3(0, Math.PI / 2, Math.PI) // @todo: hard-coded
        });
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
        this.mesh.addBehavior(this.#interactableBehavior);
        this.mesh.addBehavior(this.#highlightBehavior);

        const scene = mesh.getScene();
        const targets = this.#interactableBehavior.interactionManager.interactableMeshes as AbstractMesh[];
        this.#grabStateObserver = this.#interactableBehavior.onGrabStateChangedObservable.add(({ state }) => {
            if (state === GrabState.GRAB) {
                this.#renderObserver = scene.onBeforeRenderObservable.add(() => {
                    const target = this.#checkNearTarget(targets);
                    this.#changeTarget(target);
                });
            } else if (state === GrabState.DROP) {
                this.#changeTarget(null);
                // The conditional is necessary because a DROP can be received without a corresponding GRAB.
                // An example is when the cylinder is automatically dropped when a pour occurs and the user
                // subsequently releases the squeeze, triggering another drop.
                if (this.#renderObserver) {
                    this.#renderObserver.remove();
                    this.#renderObserver = null;
                }
            }
        });
    }

    detach = () => {
        this.#grabStateObserver.remove();
        if (this.#renderObserver) {
            this.#renderObserver.remove();
        }
    }

    #checkNearTarget(targets: AbstractMesh[]): Nullable<AbstractMesh> {
        const validTargets = targets.filter(target => {
            const isTargetBelow = this.mesh.absolutePosition.y > target.absolutePosition.y;
            const isPourable = Boolean(target.getBehaviorByName("Pourable"));
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
            if (this.#activationStateObserver) {
                this.#activationStateObserver.remove();
                this.#activationStateObserver = null;
            }
        }

        this.#currentTarget = target;
        
        if (this.#currentTarget) {
            if (this.#currentTarget instanceof Mesh) {
                this.#highlightBehavior.highlightSelf();
                this.#highlightBehavior.highlightOther(this.#currentTarget);
            }

            this.#activationStateObserver = this.#interactableBehavior.onActivationStateChangedObservable.add(({ state }) => {
                if (state === ActivationState.ACTIVE) {
                    this.pour();
                }
            });
        }
    }

    pour = () => {
        if (!this.#currentTarget) {
            throw new Error("PouringBehavior: attempted pour with no current target.");
        }
        const pourableBehavior = this.#currentTarget.getBehaviorByName("Pourable") as PourableBehavior;
        if (!pourableBehavior) {
            throw new Error("PouringBehavior: target is not pourable.");
        }

        const target = this.#currentTarget;
        this.onBeforePourObservable.notifyObservers(target);
        this.onMidPourObservable.notifyObservers(target);
        this.onAfterPourObservable.notifyObservers(target);
    }
}

const frameRate = 30;

function getFirstKeyFrame(keys: IAnimationKey[]): Nullable<IAnimationKey> {
    if (keys.length === 0) {
        return null;
    }

    let minKey = keys[0];
    for (let key of keys) {
        if (key.frame < minKey.frame) {
            minKey = key;
        }
    }
    return minKey;
}

function getLastKeyFrame(keys: IAnimationKey[]): Nullable<IAnimationKey> {
    if (keys.length === 0) {
        return null;
    }

    let maxKey = keys[0];
    for (let key of keys) {
        if (key.frame > maxKey.frame) {
            maxKey = key;
        }
    }
    return maxKey;
}

function getMidKeyFrame(keys: IAnimationKey[]): Nullable<IAnimationKey> {
    if (keys.length === 0) {
        return null;
    }

    const first = getFirstKeyFrame(keys);
    const last = getLastKeyFrame(keys);
    
    const midFrame = (first.frame + last.frame) / 2;
    const midKey = getLastKeyFrame(keys.filter(key => key.frame <= midFrame));
    return midKey
}

const pourLeftKeyFrames: IAnimationKey[] = [
    {
        frame: 0,
        value: new Vector3(Math.PI, 0, 0)
    },
    {
        frame: frameRate,
        value: new Vector3(Math.PI, 0, -Math.PI / 2)
    },
    {
        frame: 2 * frameRate,
        value: new Vector3(Math.PI, 0, 0)
    }
]
const pourRightKeyFrames = [
    {
        frame: 0,
        value: new Vector3(Math.PI, 0, 0)
    },
    {
        frame: frameRate,
        value: new Vector3(Math.PI, 0, Math.PI / 2)
    },
    {
        frame: 2 * frameRate,
        value: new Vector3(Math.PI, 0, 0)
    }
];

const pourLeftAnimation = new Animation("pour-neg-z", "rotation", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
const pourRightAnimation = new Animation("pour-pos-z", "rotation", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

pourLeftAnimation.setKeys(pourLeftKeyFrames, true);
pourRightAnimation.setKeys(pourRightKeyFrames, true);

import { Behavior, Color3, IAnimationKey, Mesh, Nullable, Observable, Observer, Scene, Vector3 } from "@babylonjs/core";
import { InteractableBehavior } from "./InteractableBehavior";
import { HighlightBehavior } from "./HighlightBehavior";
import { GrabState, InteractionXRManager } from "./InteractionXRManager";
import { PourableBehavior } from "./PourableBehavior";
import { Animation } from "@babylonjs/core";
import { log } from "./utils";

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
    onBeforePourObservable: Observable<Mesh>;
    onMidPourObservable: Observable<Mesh>;
    onAfterPourObservable: Observable<Mesh>;
    pourDelay: number = 1000;
    #delayTimeoutID: number = 0;
    animating: boolean = false;
    
    constructor(targets: Mesh[], interactionXRManager?: InteractionXRManager) {
        this.#interactableBehavior = new InteractableBehavior(interactionXRManager || undefined);
        this.#interactableBehavior.targets.push(...targets);
        this.#highlightBehavior = new HighlightBehavior(Color3.Green());
        this.onBeforePourObservable = new Observable();
        this.onMidPourObservable = new Observable();
        this.onAfterPourObservable = new Observable();
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
        const validTargets = targets.filter(target => {
            const isTargetBelow = this.mesh.absolutePosition.y > target.absolutePosition.y;
            const isPourable = Boolean(target.getBehaviorByName(PourableBehavior.name));
            const targetNotGrabbed = (target.getBehaviorByName(InteractableBehavior.name) as InteractableBehavior)?.grabState !== GrabState.GRAB;
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

    #changeTarget(target: Nullable<Mesh>) {
        if (this.#currentTarget === target) {
            return;
        }

        if (this.#currentTarget) {
            this.#highlightBehavior.unhighlightAll();
            if (this.#delayTimeoutID) {
                clearTimeout(this.#delayTimeoutID);
                this.#delayTimeoutID = 0;
            }
        }

        this.#currentTarget = target;
        
        if (this.#currentTarget) {
            this.#highlightBehavior.highlightSelf();
            this.#highlightBehavior.highlightOther(this.#currentTarget);

            // @todo: Use something other than setTimeout?
            this.#delayTimeoutID = setTimeout(() => {
                this.#delayTimeoutID = 0;
                this.pour();
            }, this.pourDelay);
        }
    }

    pour = () => {
        if (!this.#currentTarget) {
            throw new Error("PouringBehavior: attempted pour with no current target.");
        }
        const pourableBehavior = this.#currentTarget.getBehaviorByName(PourableBehavior.name) as PourableBehavior;
        if (!pourableBehavior) {
            throw new Error("PouringBehavior: target is not pourable.");
        }
        // Save checkCollisions, to be restored at the end of the animation.
        const checkCollisions = this.mesh.checkCollisions;
        const previousPosition = this.mesh.absolutePosition;
        const target = this.#currentTarget;
        this.onBeforePourObservable.notifyObservers(target);
        this.mesh.checkCollisions = false;
        const animation = this.mesh.absolutePosition.x < this.#currentTarget.absolutePosition.x ? pourRightAnimation : pourLeftAnimation;
        const keyFrames = animation.getKeys();
        const start = getFirstKeyFrame(keyFrames).frame;
        const mid = getMidKeyFrame(keyFrames).frame;
        const end = getLastKeyFrame(keyFrames).frame;

        const pouringPosition = pourableBehavior.getPouringPosition(this.mesh.absolutePosition);
        this.mesh.setAbsolutePosition(pouringPosition);
        this.animating = true;
        this.#interactableBehavior.disable();
        this.mesh.getScene().beginDirectAnimation(this.mesh, [animation], start, mid, false, 1, () => {
            this.onMidPourObservable.notifyObservers(target);
            this.mesh.getScene().beginDirectAnimation(this.mesh, [animation], mid, end, false, 1, () => {
                this.#interactableBehavior.enable();
                this.animating = false;
                this.mesh.checkCollisions = checkCollisions;
                this.mesh.setAbsolutePosition(previousPosition);
                this.onAfterPourObservable.notifyObservers(target);
            });
        });
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
        value: new Vector3(0, 0, 0)
    },
    {
        frame: frameRate,
        value: new Vector3(0, 0, -Math.PI / 2)
    },
    {
        frame: 2 * frameRate,
        value: new Vector3(0, 0, 0)
    }
]
const pourRightKeyFrames = [
    {
        frame: 0,
        value: new Vector3(0, Math.PI, 0)
    },
    {
        frame: frameRate,
        value: new Vector3(0, Math.PI, -Math.PI / 2)
    },
    {
        frame: 2 * frameRate,
        value: new Vector3(0, Math.PI, 0)
    }
];

const pourLeftAnimation = new Animation("pour-neg-z", "rotation", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
const pourRightAnimation = new Animation("pour-pos-z", "rotation", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

pourLeftAnimation.setKeys(pourLeftKeyFrames, true);
pourRightAnimation.setKeys(pourRightKeyFrames, true);

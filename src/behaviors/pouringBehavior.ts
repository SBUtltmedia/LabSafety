import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";

import { HighlightBehavior } from "./highlightBehavior";
import { InteractableBehavior } from "./interactableBehavior";
import { ActivationState, GrabState, IMeshActivationInfo, IMeshGrabInfo, InteractionMode } from "../managers/interactions/handlers/baseInteractionHandler";
import { global } from "../globalState";
import { ParticleSystem } from "@babylonjs/core";
import { CylinderSmokeBehavior } from "./cylinderSmokeBehavior";
import { Animation } from '@babylonjs/core/Animations/animation';


// Works with InteractableBehavior and HighlightBehavior to determine
// when to pour and indicate to the user when a pour is possible.

export class PouringBehavior implements Behavior<Mesh> {
    mesh: Mesh;
    #interactableBehavior: InteractableBehavior;
    #highlightBehavior: HighlightBehavior;
    #grabStateObserver: Observer<IMeshGrabInfo>;
    #mobileGrabStateObserver: Observer<GrabState>;
    #activationStateObserver: Nullable<Observer<IMeshActivationInfo>> = null;
    #renderObserver: Nullable<Observer<Scene>>;
    #currentTarget: Nullable<AbstractMesh>;
    onBeforePourObservable: Observable<AbstractMesh>;
    onMidPourObservable: Observable<AbstractMesh>;
    onAfterPourObservable: Observable<AbstractMesh>;
    onAttachObservable: Observable<Boolean>;
    liquidMesh?: AbstractMesh; // If this is set, setting empty to true will make this mesh invisible, and setting empty to false will make it visible.
    #empty: boolean = false;
    pourDelay: number = 1000;
    animating: boolean = false;
    onAnimationChangeObservable: Observable<Boolean>;
    #scene: Scene;
    particleSystem: ParticleSystem;
    isParticlesSetup: boolean = false;
    
    constructor() {
        this.#highlightBehavior = new HighlightBehavior(Color3.Green());
        this.onBeforePourObservable = new Observable();
        this.onMidPourObservable = new Observable();
        this.onAfterPourObservable = new Observable();
        this.onAnimationChangeObservable = new Observable();
        this.onAttachObservable = new Observable();
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
        this.#scene = scene;
        const camera = scene.activeCamera;

        const targets = this.#interactableBehavior.interactionManager.interactableMeshes as AbstractMesh[];
        this.#grabStateObserver = this.#interactableBehavior.onGrabStateChangedObservable.add(({ state }) => {
            if (state === GrabState.GRAB) {
                this.#renderObserver = scene.onBeforeRenderObservable.add(() => {
                    const target = this.#checkNearTarget(targets);
                    
                    if (global.sop.currentSubTask) {
                        let [left,right] = global.sop.currentSubTask.name.split(" -> ");
                        if( (this.mesh.id ===`cylinder-${left.toLowerCase()}`) && (target?.id === `cylinder-${right.toLowerCase()}`)){
                            this.#changeTarget(target,new Color3(0, 255, 0))
                        }
                        else{
                            this.#changeTarget(target,new Color3(255, 0, 0))
                        }
                    }
                });
            } else if (state === GrabState.DROP) {
                this.#changeTarget(null,null);
                // The conditional is necessary because a DROP can be received without a corresponding GRAB.
                // An example is when the cylinder is automatically dropped when a pour occurs and the user
                // subsequently releases the squeeze, triggering another drop.
                if (this.#renderObserver) {
                    this.#renderObserver.remove();
                    this.#renderObserver = null;
                }
            }           
        });

        this.#mobileGrabStateObserver = this.#interactableBehavior.onMobileGrabStateChangeObservable.add(state => {
            if (state === GrabState.GRAB) {
                this.#renderObserver = scene.onBeforeRenderObservable.add(() => {
                    const target = this.#checkNearTarget(targets);
                    this.#changeTarget(target,null);
                });
            } else if (state === GrabState.DROP) {
                this.#changeTarget(null,null);
                // The conditional is necessary because a DROP can be received without a corresponding GRAB.
                // An example is when the cylinder is automatically dropped when a pour occurs and the user
                // subsequently releases the squeeze, triggering another drop.
                if (this.#renderObserver) {
                    this.#renderObserver.remove();
                    this.#renderObserver = null;
                }
            }            
        })

        let waitForFinish = false;
        let isQueued = false;
        const tiltQueue: { mesh: AbstractMesh; initialTilt: number; targetTilt: number }[] = [];
        
        const processTiltQueue = () => {
            if (tiltQueue.length === 0 || waitForFinish) return;
        
            const { mesh, initialTilt, targetTilt } = tiltQueue.shift()!;
            let tiltAnim = new Animation("rotate", "rotation.z", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            let rotateKeys = [
                { frame: 0, value: initialTilt },
                { frame: 60, value: targetTilt }
            ];

            tiltAnim.setKeys(rotateKeys);
            waitForFinish = true;
            this.#scene.beginDirectAnimation(mesh, [tiltAnim], 0, 60, false, 1.5, () => {
                waitForFinish = false;
                tilted = targetTilt !== 0; // Update `tilted` based on targetTilt
                processTiltQueue(); // Process the next tilt in queue
            });
        }
        
        // Function to queue tilt requests
        const tilt = (mesh: AbstractMesh, initialTilt: number, targetTilt: number) => {
            tiltQueue.push({ mesh, initialTilt, targetTilt });
            if (!waitForFinish) {
                processTiltQueue();
            }
        }
        
        let tilted = false;
        let oldAngle: Vector3 = Vector3.Zero();
        let oldPos: Vector3 = Vector3.Zero();
        let dir = 1;
        this.#activationStateObserver = this.#interactableBehavior.onActivationStateChangedObservable.add(({ state }) => {
            const mode = this.#interactableBehavior.interactionManager.interactionMode;
        
            if (state === ActivationState.ACTIVE && !this.#empty && this.#currentTarget) {
                isQueued = true; // Set flag to avoid duplicate tilt-back queue
                if (mode === InteractionMode.DESKTOP || mode === InteractionMode.MOBILE) {
                    if (this.#currentTarget.position.x >= this.mesh.position.x) {
                        tilt(this.mesh, 0, Math.PI / 3);
                    } else {
                        dir = -1;
                        tilt(this.mesh, 0, -Math.PI / 3);
                    }
                    tilted = true;
                } else {
                    const sourcePos = this.mesh.position;
                    const targetPos = this.#currentTarget.position;
        
                    let dirVector = new Vector3(targetPos.x - sourcePos.x, targetPos.y - sourcePos.y, targetPos.z - sourcePos.z);
                    oldAngle.copyFrom(this.mesh.rotation);
                    oldPos.copyFrom(this.mesh.position);
        
                    this.mesh.lookAt(targetPos);
                    this.mesh.rotation.x = 0;
                    this.mesh.rotation.y *= -1;
                    this.mesh.rotation.z = Math.PI + Math.PI / 4;
        
        
                    this.mesh.position.y += 0.1;
                    tilted = true;
                }
                this.pour();
            } else if (state === ActivationState.INACTIVE && isQueued) {
                isQueued = false;
                if (mode === InteractionMode.XR) {
                    this.mesh.rotation.copyFrom(oldAngle);
                    this.mesh.position.copyFrom(oldPos);
                } else {
                    tilt(this.mesh, dir * Math.PI / 3, 0); // Queue up the tilt back
                    dir = 1;
                }
            }
        });
        

        // this.onAttachObservable.notifyObservers(true);
    }

    detach = () => {
        this.#grabStateObserver.remove();
        if (this.#mobileGrabStateObserver) {
            this.#mobileGrabStateObserver.remove();
        }
        this.#activationStateObserver.remove();
        if (this.#renderObserver) {
            this.#renderObserver.remove();
        }
        this.#highlightBehavior.unhighlightAll();
        this.onAttachObservable.notifyObservers(false);
        const smokeBehavior = this.mesh.getBehaviorByName("smoke") as CylinderSmokeBehavior;
        smokeBehavior.detach();
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
            const isNotCurrentMesh = this.mesh !== target;
            const isPourable = Boolean(target.getBehaviorByName("Pouring"));
            const targetNotGrabbed = !(target.getBehaviorByName("Interactable") as InteractableBehavior).grabbing;
            const intersectingTarget = this.mesh.intersectsMesh(target);
            return isNotCurrentMesh && isPourable && targetNotGrabbed && intersectingTarget;
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

    #changeTarget(target: Nullable<AbstractMesh>,color:Color3) {
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
                this.#highlightBehavior.highlightSelf(color);
                this.#highlightBehavior.highlightOther(this.#currentTarget,color );
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
    startSmokes() {
        const smokeBehavior = this.mesh.getBehaviorByName("smoke") as CylinderSmokeBehavior;
        smokeBehavior.startSystem();
    }

    stopSmokes () {
        const smokeBehavior = this.mesh.getBehaviorByName("smoke") as CylinderSmokeBehavior;
        smokeBehavior.startSystem();
    }
    
}

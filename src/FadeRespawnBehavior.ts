import { float } from "@babylonjs/core/types";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observer } from "@babylonjs/core/Misc/observable";

import { InteractableBehavior } from "./InteractableBehavior";
import { GrabState } from "./InteractionXRManager";

import { PouringBehavior } from "./PouringBehavior";


export class FadeRespawnBehavior implements Behavior<Mesh> {
    mesh: Mesh
    startPos: Vector3
    #delay: float
    #interactableBehavior: InteractableBehavior;
    #grabStateObserver: Observer<GrabState>;
    #animationStateObserver: Observer<Boolean>;
    #pouringBehavior: PouringBehavior;


    constructor(delay: float = 0.5) {
        this.#delay = delay;
        this.startPos = Vector3.Zero();
    }

    init(): void {
        
    }

    static get name() {
        return "FadeAndRespawn";
    }

    get name() {
        return "FadeAndRespawn";
    }    

    attach(target: Mesh): void {
        this.mesh = target;
        this.#interactableBehavior = this.mesh.getBehaviorByName("Interactable") as InteractableBehavior;
        this.#pouringBehavior = this.mesh.getBehaviorByName("Pouring") as PouringBehavior;

        this.#grabStateObserver = this.#interactableBehavior.onGrabStateChangedObservable.add(grabState => {
            if (grabState === GrabState.DROP) {
                if (this.#pouringBehavior.animating) {
                    if (this.#animationStateObserver) {
                        this.#animationStateObserver.remove();
                    }
                    this.#animationStateObserver = this.#pouringBehavior.onAnimationChangeObservable.add(state => {
                        if (state === false) {
                            this.#placeMeshAtSpawn();
                        }
                    })
                } else {
                    this.#placeMeshAtSpawn();
                }
            }
        })

    }

    detach(): void {
        this.#grabStateObserver.remove();
        this.#animationStateObserver.remove();
    }

    #placeMeshAtSpawn() {
        this.mesh.position.copyFrom(this.startPos);
        this.mesh.rotation.copyFromFloats(Math.PI, 0, 0);
    }
}
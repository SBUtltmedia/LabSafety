import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Animation } from "@babylonjs/core/Animations/animation";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observer } from "@babylonjs/core/Misc/observable";

import { InteractableBehavior } from "./InteractableBehavior";
import { GrabState } from "./InteractionXRManager";
import { PouringBehavior } from "./PouringBehavior";

interface IAnimation {
    name: string,
    startValue: number,
    animation?: Animation
}

export class FadeRespawnBehavior implements Behavior<Mesh> {
    mesh: Mesh
    startPos: Vector3
    #speedRatio: number
    #interactableBehavior: InteractableBehavior;
    #grabStateObserver: Observer<[Nullable<AbstractMesh>, GrabState]>;
    #animationStateObserver: Observer<boolean>;
    #pouringBehavior: PouringBehavior;
    #animations: IAnimation[];
    #scene: Scene;

    constructor(speedRatio: number = 1.25) {
        this.#speedRatio = speedRatio;
        this.startPos = Vector3.Zero();

        this.#animations = [
            {name: "Invisibility", startValue: 1},
            {name: "Visibility", startValue: 0},
        ];

        this.#animations.forEach((animation: IAnimation) => {
            animation.animation = new Animation(
                animation.name,
                "visibility",
                60,
                Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT
            )

            animation.animation.setKeys([
                {frame: 0, value: animation.startValue},
                {frame: 30, value: animation.startValue ? 0 : 1}
            ]);
        })
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
        this.#scene = this.mesh.getScene();

        this.#grabStateObserver = this.#interactableBehavior.onGrabStateChangedObservable.add(([_, grabState]) => {
            if (grabState === GrabState.DROP) {
                if (this.#pouringBehavior.animating) {
                    if (this.#animationStateObserver) {
                        this.#animationStateObserver.remove();
                    }
                    this.#animationStateObserver = this.#pouringBehavior.onAnimationChangeObservable.add(state => {
                        if (state === false) {
                            this.#fadeAndRespawn();
                        }
                    })
                } else {
                    this.#fadeAndRespawn();
                }
            }
        })

    }

    detach(): void {
        this.#grabStateObserver.remove();
        this.#animationStateObserver.remove();
    }

    #fadeAndRespawn() {
        let dist = Math.abs(Vector3.Distance(this.mesh.position, this.startPos));

        if (dist <= 0.15) { 
            this.#placeMeshAtSpawn();
            return;
        }

        this.#scene.beginDirectHierarchyAnimation(this.mesh, false, [this.#animations.find(animation => {
                    return animation.name === "Invisibility"
        }).animation], 0, 60, false, this.#speedRatio, () => {
            this.#placeMeshAtSpawn();
            this.#reappear();            
        });
    }

    #reappear() {
        this.#scene.beginDirectHierarchyAnimation(this.mesh, false, [this.#animations.find(animation => {
            return animation.name === "Visibility"
        }).animation], 0, 60, false, this.#speedRatio);
    }

    #placeMeshAtSpawn() {
        this.mesh.position.copyFrom(this.startPos);
        this.mesh.rotation.copyFromFloats(Math.PI, 0, 0);
    }
}
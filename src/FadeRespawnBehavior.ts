import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Animation } from "@babylonjs/core/Animations/animation";
import { Scene } from "@babylonjs/core/scene";

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
    #grabStateObserver: Observer<GrabState>;
    #animationStateObserver: Observer<Boolean>;
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

        this.#grabStateObserver = this.#interactableBehavior.onGrabStateChangedObservable.add(grabState => {
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

        // Note: Looping though the mesh and every child mesh except the last one because:
        // The callback which scene.beginDirectAnimation takes runs after the animation takes place,
        // so the cylinder should always respawn after the last mesh has disappeared. Could use an observable to avoid this.

        let listMeshes = [this.mesh, ...this.mesh.getChildMeshes()];

        for (let numMesh = 0; numMesh < listMeshes.length - 1; numMesh++) {
            this.#scene.beginDirectAnimation(listMeshes[numMesh], [this.#animations.find(animation => {
                return animation.name === "Invisibility"
            }).animation], 0, 60, false, this.#speedRatio);
        }

        this.#scene.beginDirectAnimation(listMeshes[listMeshes.length - 1], [this.#animations.find(animation => {
            return animation.name === "Invisibility"
        }).animation], 0, 60, false, this.#speedRatio, () => {
            this.#placeMeshAtSpawn();
            this.#reappear();
        });
    }

    #reappear() {
        let listMeshes = [this.mesh, ...this.mesh.getChildMeshes()];

        listMeshes.forEach(mesh => {
            this.#scene.beginDirectAnimation(mesh, [this.#animations.find(animation => {
                return animation.name === "Visibility"
            }).animation], 0, 60, false);
        });
    }

    #placeMeshAtSpawn() {
        this.mesh.position.copyFrom(this.startPos);
        this.mesh.rotation.copyFromFloats(Math.PI, 0, 0);
    }
}
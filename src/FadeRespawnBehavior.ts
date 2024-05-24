import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Animation } from "@babylonjs/core/Animations/animation";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observer } from "@babylonjs/core/Misc/observable";

import { InteractableBehavior } from "./interactableBehavior";
import { GrabState, IMeshGrabInfo } from "./interactionManager";

interface IAnimation {
    name: string,
    startValue: number,
    animation?: Animation
}

export const MIN_FADE_DISTANCE = 0.15;

export class FadeRespawnBehavior implements Behavior<Mesh> {
    mesh: Mesh;
    spawnPosition: Vector3 = Vector3.Zero();
    spawnRotation: Vector3 = Vector3.Zero();
    #speedRatio: number;
    #interactableBehavior: InteractableBehavior;
    #grabStateObserver: Observer<IMeshGrabInfo>;
    #animationStateObserver: Nullable<Observer<boolean>> = null;
    #animations: IAnimation[];
    #scene: Scene;

    constructor(speedRatio: number = 1.25) {
        this.#speedRatio = speedRatio;

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

    get name() {
        return "FadeAndRespawn";
    }    

    attach(target: Mesh): void {
        this.mesh = target;
        this.#interactableBehavior = this.mesh.getBehaviorByName("Interactable") as InteractableBehavior;
        if (!this.#interactableBehavior) {
            throw new Error(`${this.name} behavior must be attached to a mesh with an Interactable behavior.`);
        }
        this.#scene = this.mesh.getScene();

        this.#grabStateObserver = this.#interactableBehavior.onGrabStateChangedObservable.add(({ state }) => {
            if (state === GrabState.DROP) {
                this.#fadeAndRespawn();
            }
        })

    }

    detach(): void {
        this.#grabStateObserver.remove();
        if (this.#animationStateObserver) {
            this.#animationStateObserver.remove();
        }
    }

    #fadeAndRespawn() {
        let dist = Math.abs(Vector3.Distance(this.mesh.getAbsolutePosition(), this.spawnPosition));

        if (dist <= MIN_FADE_DISTANCE) { 
            this.#respawn();
            return;
        }

        this.#scene.beginDirectHierarchyAnimation(this.mesh, false, [this.#animations.find(animation => animation.name === "Invisibility").animation],
        0, 60, false, this.#speedRatio, () => {
            this.#respawn();
            this.#reappear();            
        });
    }

    #reappear() {
        this.#scene.beginDirectHierarchyAnimation(this.mesh, false, [this.#animations.find(animation => {
            return animation.name === "Visibility"
        }).animation], 0, 60, false, this.#speedRatio);
    }

    #respawn = () => {
        this.mesh.position.copyFrom(this.spawnPosition);
        this.mesh.rotation.copyFrom(this.spawnRotation);
    }

    setSpawnPoint = (spawnPosition: Vector3, spawnRotation: Vector3) => {
        this.spawnPosition.copyFrom(spawnPosition);
        this.spawnRotation.copyFrom(spawnRotation);
    }
}

export function setRespawnPoints(scene: Scene): void {
    const behaviors = scene.meshes.map(mesh => mesh.getBehaviorByName("FadeAndRespawn"))
        .filter(behavior => Boolean(behavior)) as FadeRespawnBehavior[];
    for (const behavior of behaviors) {
        behavior.setSpawnPoint(behavior.mesh.position, behavior.mesh.rotation);
    }
}

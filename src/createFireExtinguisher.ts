import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Nullable } from "@babylonjs/core/types";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { FireBehavior } from "./FireBehavior";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { SmokeParticles } from "./SmokeParticles";

import { InteractableBehavior } from "./interactableBehavior";
import { ActivationState } from "./interactionManager";
import { interactionManager } from "./scene";
import { FadeRespawnBehavior } from "./FadeRespawnBehavior";
import { NUM_FIRES } from "./Constants";
import { HighlightBehavior } from "./HighlightBehavior";
import { Color3 } from "@babylonjs/core";

const FIRE_EXTINGUISHER_RANGE = 4.3;

export function createFireExtinguisher(mesh: Mesh): void {
    const interactableBehavior = new InteractableBehavior(interactionManager, {
        activatable: true,
        defaultAnchorRotation: new Vector3(0, 0, Math.PI)
    });

    const fadeRespawnBehavior = new FadeRespawnBehavior();
    const highlightBehavior = new HighlightBehavior(new Color3(0, 255, 0));

    mesh.addBehavior(interactableBehavior);
    mesh.addBehavior(fadeRespawnBehavior);
    mesh.addBehavior(highlightBehavior);

    highlightBehavior.unhighlightSelf();

    let smokeSystem = new SmokeParticles(mesh);

    let observer: Nullable<Observer<Scene>> = null;
    const scene = mesh.getScene();
    const debugSphere1 = MeshBuilder.CreateSphere("debug-sphere-1", {
        diameter: 0.1
    });
    const debugSphere2 = MeshBuilder.CreateSphere("debug-sphere-2", {
        diameter: 0.1
    });
    debugSphere1.isVisible = false;
    debugSphere2.isVisible = false;
    let timeout: number = null;
    let hightlightBehav = mesh.getBehaviorByName("Highlight") as HighlightBehavior;
    
    scene.onBeforeRenderObservable.add(() => {
        const ray = new Ray(mesh.absolutePosition, mesh.getDirection(Axis.Z).normalize(), FIRE_EXTINGUISHER_RANGE);
        debugSphere1.setAbsolutePosition(ray.origin);
        debugSphere2.setAbsolutePosition(ray.origin.add(ray.direction.scale(ray.length)));
        const pickInfo = scene.pickWithRay(ray, pickedMesh => {
            const fireBehavior = pickedMesh.getBehaviorByName("Fire") as FireBehavior;
            return Boolean(fireBehavior && !fireBehavior.extinguished);
         });
        
        if (pickInfo.hit && pickInfo.pickedMesh.name === "emitter1") {
            hightlightBehav.highlightSelf(new Color3(0, 255, 0));
        } else {
            hightlightBehav.unhighlightSelf();
        }
    });

    interactableBehavior.onActivationStateChangedObservable.add(({ state }) => {
        if (state === ActivationState.ACTIVE) {
            smokeSystem.start();
            observer = scene.onBeforeRenderObservable.add(() => {
                // Check for hitting the fire
                // @todo: The ray should originate from the nozzle mesh.
                const ray = new Ray(mesh.absolutePosition, mesh.getDirection(Axis.Z).normalize(), FIRE_EXTINGUISHER_RANGE);
                debugSphere1.setAbsolutePosition(ray.origin);
                debugSphere2.setAbsolutePosition(ray.origin.add(ray.direction.scale(ray.length)));
                const pickInfo = scene.pickWithRay(ray, pickedMesh => {
                    const fireBehavior = pickedMesh.getBehaviorByName("Fire") as FireBehavior;
                    return Boolean(fireBehavior && !fireBehavior.extinguished);
                 });
                
                if (pickInfo.hit && pickInfo.pickedMesh.name === "emitter1") {
                    console.log("Hit!");
                    if (timeout === null) {
                        timeout = setTimeout(() => {
                            for (let i = 1; i <= NUM_FIRES; i++) {
                                let emitter = scene.getMeshByName(`emitter${i}`);
                                const fireBehavior = emitter.getBehaviorByName("Fire") as FireBehavior;
                                if (!fireBehavior.extinguished) {
                                    fireBehavior.extinguish();
                                }
                            }
                        }, 2500);
                    }
                }
            });
            // @todo: Activate particles
        } else if (state === ActivationState.INACTIVE) {
            smokeSystem.stop();
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            // Remove observer
            if (observer) {
                observer.remove();
                observer = null;
            }
            // @todo: Deactivate particles
        }
    });
}

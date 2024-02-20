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

const FIRE_EXTINGUISHER_RANGE = 2;

export function createFireExtinguisher(mesh: Mesh): void {
    const interactableBehavior = new InteractableBehavior(interactionManager, {
        activatable: true,
        defaultRotation: new Vector3(0, 0, Math.PI)
    });

    let smokeSystem = new SmokeParticles(mesh);

    mesh.addBehavior(interactableBehavior);

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
                    const fireBehavior = pickedMesh.getBehaviorByName(FireBehavior.name) as FireBehavior;
                    return Boolean(fireBehavior && !fireBehavior.extinguished);
                });
                if (pickInfo.hit) {
                    const fireBehavior = pickInfo.pickedMesh.getBehaviorByName(FireBehavior.name) as FireBehavior;
                    if (!fireBehavior.extinguished) {
                        fireBehavior.extinguish();
                    }
                }
            });
            // @todo: Activate particles
        } else if (state === ActivationState.INACTIVE) {
            smokeSystem.stop();
            // Remove observer
            if (observer) {
                observer.remove();
                observer = null;
            }
            // @todo: Deactivate particles
        }
    });
}

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { interactionXRManager } from "./scene";
import { InteractableBehavior } from "./InteractableBehavior";
import { ActivationState } from "./InteractionXRManager";
import { Scene } from "@babylonjs/core/scene";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Nullable } from "@babylonjs/core/types";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { FireBehavior } from "./FireBehavior";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

const FIRE_EXTINGUISHER_RANGE = 2;

export function createFireExtinguisher(mesh: Mesh): void {
    const interactableBehavior = new InteractableBehavior(true, interactionXRManager);
    
    // @todo: This is terrible. Collapse the root mesh.
    const childMesh = mesh.getChildMeshes().find(mesh => mesh.id === "pCube10");

    childMesh.addBehavior(interactableBehavior);

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
    interactableBehavior.onActivationStateChangedObservable.add(activationState => {
        if (activationState === ActivationState.ACTIVE) {
            debugSphere1.isVisible = true;
            debugSphere2.isVisible = true;
            observer = scene.onBeforeRenderObservable.add(() => {
                // Check for hitting the fire
                // @todo: The ray should originate from the nozzle mesh.
                // @todo: The ray length is a magic number.
                const ray = new Ray(childMesh.absolutePosition, childMesh.getDirection(Axis.X).normalize(), FIRE_EXTINGUISHER_RANGE);
                debugSphere1.setAbsolutePosition(ray.origin);
                debugSphere2.setAbsolutePosition(ray.origin.add(ray.direction.scale(ray.length)));
                const pickInfo = scene.pickWithRay(ray, mesh => {
                    const fireBehavior = mesh.getBehaviorByName(FireBehavior.name) as FireBehavior;
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
        } else if (activationState === ActivationState.INACTIVE) {
            debugSphere1.isVisible = false;
            debugSphere2.isVisible = false;
            // Remove observer
            if (observer) {
                observer.remove();
                observer = null;
            }
            // @todo: Deactivate particles
        }
    });
}

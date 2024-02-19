import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observer } from "@babylonjs/core/Misc/observable";

import { interactionManager } from "./scene";
import { GrabState } from "./interactionManager";
import { InteractableBehavior } from "./interactableBehavior";
import { log } from "./utils";

export function createFireExtinguisherCabinet(mesh: Mesh) {
    const doorMesh = mesh.getChildMeshes(true)[0];
    doorMesh.rotationQuaternion = null;
    // @todo: I think there are issues here with the observers being cleared on switching XR mode - probably
    // want to find some way to save them.
    const interactableBehavior = new InteractableBehavior(interactionManager, false);
    interactableBehavior.moveAttached = false;
    let renderObserver: Nullable<Observer<Scene>> = null;
    const scene = mesh.getScene();
    interactableBehavior.onGrabStateChangedObservable.add(({ anchor, state }) => {
        if (state === GrabState.GRAB) {
            renderObserver = scene.onBeforeRenderObservable.add(() => {
                const diff = anchor.getAbsolutePosition().subtract(doorMesh.getAbsolutePosition());
                diff.y = 0;  // @todo: Use a projection instead?
                if (diff.x > 0) {
                    return;
                }
                const offset = diff.z < 0 ? 0 : Math.PI;  // Necessary because the range of arctangent is (-Math.PI / 2, Math.PI / 2)
                const angle = -Math.atan(diff.x / diff.z);
                doorMesh.rotation.copyFromFloats(0, angle + offset, 0);
            });
        } else if (state === GrabState.DROP) {
            if (renderObserver) {
                renderObserver.remove();
                renderObserver = null;
            }
        }
    });
    doorMesh.addBehavior(interactableBehavior);
}

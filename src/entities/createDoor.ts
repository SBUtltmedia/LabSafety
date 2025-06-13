import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Observer } from "@babylonjs/core/Misc/observable";

import { interactionManager } from "../scene";
import { InteractableBehavior } from "../behaviors/interactableBehavior";
import { GrabState } from "../managers/interactions/handlers/baseInteractionHandler";
import { AbstractMesh, Mesh, Quaternion, Texture, TransformNode, VolumetricLightScatteringPostProcess } from "@babylonjs/core";

export function createDoor(doorNode: TransformNode) {
    const mesh = doorNode.getChildMeshes().find(mesh => mesh.name === "ExitDoor")

    console.log("Mesh: ", mesh);
    const interactableBehavior = new InteractableBehavior(interactionManager, {
        moveAttached: false
    });
    let renderObserver: Nullable<Observer<Scene>> = null;

    let scene = mesh.getScene();

    interactableBehavior.onGrabStateChangedObservable.add(({ anchor, state }) => {
        if (state === GrabState.GRAB) {
            console.log("Grab!");
            renderObserver = scene.onBeforeRenderObservable.add(() => {
                // console.log("Anchor:", anchor);
                const diff = anchor.position.subtract(doorNode.position);
                diff.y = 0;
                if (diff.x > 0) {
                    console.log("return");
                    return;
                }
                const offset = diff.z < 0 ? 0 : Math.PI;
                const angle = -Math.atan(diff.x / diff.z);
                const quaternionRotation = Quaternion.FromEulerAngles(0, angle + offset, 0);
                doorNode.rotationQuaternion = quaternionRotation;

                let plane = scene.getMeshByName("portal") as Mesh;
                plane.isVisible = true;
            });
        } else if (state === GrabState.DROP) {
            console.log("Drop");
            if (renderObserver) {
                renderObserver.remove();
                renderObserver = null;
            }
        }
    });
    
    mesh.addBehavior(interactableBehavior);
    console.log("Add behavior");
}
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InteractableBehavior } from "./InteractableBehavior";
import { interactionXRManager } from "./scene";
import { GrabState } from "./InteractionXRManager";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Nullable } from "@babylonjs/core/types";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Vector3 } from "@babylonjs/core";

const topLimit = 1.93;
const bottomLimit = 1.3;

const moveDivider = (dividerMesh: Mesh, yDelta: number) => {
    let dividerPosition = Math.floor(dividerMesh.position.y * 100) / 100; // round down to 2 decimal places
    if (dividerPosition + yDelta >= bottomLimit && dividerPosition + yDelta <= topLimit) {
        dividerMesh.position.y += yDelta;
    }
}

export const createGlassDivider = (dividerMesh: Mesh) => {
    const scene = dividerMesh.getScene();
    let renderObserver: Nullable<Observer<Scene>> = null;
    let pointerDragObserver: Nullable<Observer<any>> = null;

    const interactableBehavior = new InteractableBehavior(false, false, interactionXRManager);
    dividerMesh.addBehavior(interactableBehavior);

    interactableBehavior.onGrabStateChangedObservable.add(([grabbingMesh, grabState]) => {
        if (grabState == GrabState.GRAB) {
            const pointerDragBehavior = dividerMesh.getBehaviorByName("PointerDrag") as PointerDragBehavior;

            if (pointerDragBehavior) {
                pointerDragObserver = pointerDragBehavior.onDragObservable.add((pointerInfo) => {
                    let yDelta = pointerInfo.delta.y;
                    moveDivider(dividerMesh, yDelta);
                })
            }

            if (grabbingMesh) {
                let curDividerMeshPos = Vector3.Zero();
                curDividerMeshPos.copyFrom(grabbingMesh.getAbsolutePosition());
                renderObserver = scene.onBeforeRenderObservable.add(() => {
                    const diff = grabbingMesh.getAbsolutePosition().subtract(curDividerMeshPos);
                    let yDelta = Math.floor(diff.y * 100) / 100;

                    moveDivider(dividerMesh, yDelta);

                    curDividerMeshPos.copyFrom(grabbingMesh.getAbsolutePosition());
                })
            }

        } else if (grabState == GrabState.DROP) {
            if (pointerDragObserver) {
                pointerDragObserver.remove();
            }
            if (renderObserver) {
                renderObserver.remove();
            }
        }
    })
}
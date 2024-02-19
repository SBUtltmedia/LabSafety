import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Nullable } from "@babylonjs/core/types";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerInfo } from "@babylonjs/core/Events/pointerEvents";

import { InteractableBehavior } from "./interactableBehavior";
import { GrabState } from "./interactionManager";
import { interactionManager } from "./scene";

const topLimit = 1.93;
const bottomLimit = 1.3;

interface IEventInfo {
    delta: Vector3;
    dragPlanePoint: Vector3;
    dragPlaneNormal: Vector3;
    dragDistance: number;
    pointerId: number;
    pointerInfo: PointerInfo;    
}

const moveDivider = (dividerMesh: Mesh, yDelta: number) => {
    let dividerPosition = Math.floor(dividerMesh.position.y * 100) / 100; // round down to 2 decimal places
    if (dividerPosition + yDelta >= bottomLimit && dividerPosition + yDelta <= topLimit) {
        dividerMesh.position.y += yDelta;
    }
}

export const createGlassDivider = (dividerMesh: Mesh) => {
    const scene = dividerMesh.getScene();
    let renderObserver: Nullable<Observer<Scene>> = null;
    let pointerDragObserver: Nullable<Observer<IEventInfo>> = null;

    const interactableBehavior = new InteractableBehavior(interactionManager, false);
    interactableBehavior.moveAttached = false;
    dividerMesh.addBehavior(interactableBehavior);

    interactableBehavior.onGrabStateChangedObservable.add(({ anchor, state }) => {
        if (state == GrabState.GRAB) {
            const pointerDragBehavior = dividerMesh.getBehaviorByName("PointerDrag") as PointerDragBehavior;

            if (pointerDragBehavior) {
                pointerDragObserver = pointerDragBehavior.onDragObservable.add((eventInfo) => {
                    let yDelta = eventInfo.delta.y;
                    moveDivider(dividerMesh, yDelta);
                })
            }

            if (anchor) {
                // Do this because in VR, player can grab the glass divider from anywhere within it, and the y-position
                // of the divider is much higher. So I made a variable that offsets it by the y-position of the
                // hand.
                let curDividerMeshPos = Vector3.Zero();
                curDividerMeshPos.copyFrom(anchor.getAbsolutePosition());
                renderObserver = scene.onBeforeRenderObservable.add(() => {
                    const diff = anchor.getAbsolutePosition().subtract(curDividerMeshPos);
                    let yDelta = Math.floor(diff.y * 100) / 100;

                    moveDivider(dividerMesh, yDelta);

                    curDividerMeshPos.copyFrom(anchor.getAbsolutePosition());
                })
            }

        } else if (state == GrabState.DROP) {
            if (pointerDragObserver) {
                pointerDragObserver.remove();
            }
            if (renderObserver) {
                renderObserver.remove();
            }
        }
    })
}
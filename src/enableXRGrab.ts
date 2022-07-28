import { WebXRInput } from "@babylonjs/core/XR/webXRInput";
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Nullable } from '@babylonjs/core/types';
import { MAX_XR_GRAB_DISTANCE, GrabbableAbstractMesh } from "./constants";

export default function enableXRGrab(xrInput: WebXRInput) {
    const scene = xrInput.xrSessionManager.scene;
    xrInput.onControllerAddedObservable.add(controller => {
        controller.onMotionControllerInitObservable.add(motionController => {
            const ray = new Ray(Vector3.Zero(), Vector3.Zero(), MAX_XR_GRAB_DISTANCE);
            let pickedMesh: Nullable<AbstractMesh>;
            const squeezeComponent = motionController.getComponentOfType('squeeze')!;
            squeezeComponent.onButtonStateChangedObservable.add(() => {
                const controllerMesh = motionController.rootMesh;
                if (squeezeComponent.pressed) {
                    controller.getWorldPointerRayToRef(ray, true);
                    const hit = scene.pickWithRay(ray, mesh => (mesh as GrabbableAbstractMesh).grabbable);
                    if (hit) {
                        ({ pickedMesh } = hit);
                        (pickedMesh?.parent as AbstractMesh | undefined)?.setParent(controllerMesh);
                    }
                } else {
                    (pickedMesh?.parent as AbstractMesh | undefined)?.setParent(null);
                }
            });
        });
    });
}
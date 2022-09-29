import { WebXRInput } from '@babylonjs/core/XR/webXRInput';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Nullable } from '@babylonjs/core/types';

import { MAX_XR_GRAB_DISTANCE, GrabbableAbstractMesh } from './constants';
import { collidingMeshes } from './globals';


export default function enableXRGrab(xrInput: WebXRInput) {
    const scene = xrInput.xrSessionManager.scene;
    xrInput.onControllerAddedObservable.add(controller => {
        controller.onMotionControllerInitObservable.add(motionController => {
            const ray = new Ray(Vector3.Zero(), Vector3.Zero(), MAX_XR_GRAB_DISTANCE);
            let pickedMesh: Nullable<AbstractMesh>;
            const squeezeComponent = motionController.getComponentOfType('squeeze')!;
            let meshCollides: boolean = false;  // If the mesh can collide, it will be disabled while grabbed
            squeezeComponent.onButtonStateChangedObservable.add(() => {
                const controllerMesh = motionController.rootMesh;
                if (squeezeComponent.pressed) {
                    controller.getWorldPointerRayToRef(ray, true);
                    const hit = scene.pickWithRay(ray, mesh => (mesh as GrabbableAbstractMesh).grabbable);
                    if (hit) {
                        ({ pickedMesh } = hit);
                        if (pickedMesh?.parent && controllerMesh) {
                            controllerMesh.addChild(pickedMesh.parent as AbstractMesh, true);
                            (pickedMesh as GrabbableAbstractMesh).grabbed = true;
                            const collidingMeshesIndex = collidingMeshes.findIndex(mesh => mesh === pickedMesh!.parent);
                            if (collidingMeshesIndex !== -1) {
                                meshCollides = true;
                                collidingMeshes.splice(collidingMeshesIndex, 1);
                            }
                        }
                    }
                } else {
                    controllerMesh?.getChildMeshes().forEach(childMesh => {
                        const grabbedMesh = childMesh.getChildMeshes().find(m => (m as GrabbableAbstractMesh).grabbed);
                        if (grabbedMesh) {
                            controllerMesh.removeChild(childMesh, true);
                            (grabbedMesh as GrabbableAbstractMesh).grabbed = false;
                            if (meshCollides) {
                                collidingMeshes.push(childMesh);
                            }
                        }
                    });
                }
            });
        });
    });
}
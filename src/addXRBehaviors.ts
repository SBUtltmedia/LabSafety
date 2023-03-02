import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Ray } from "@babylonjs/core/Culling/ray";
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";
import { MotionControllerWithGrab } from "./Constants";

export function addXRBehaviors(scene:Scene,xrCamera:any,handAnimations:any){ 
    let cylinder: AbstractMesh;
    let gotSomething: PointerDragBehavior;

xrCamera.input.onControllerAddedObservable.add(controller => {
    controller.onMotionControllerInitObservable.add(motionController => {
        (motionController as MotionControllerWithGrab).handID = motionController.handedness;
        
        let currentHand = (motionController as MotionControllerWithGrab);
        let ray = new Ray(Vector3.Zero(), Vector3.Zero(), 0.25);
        controller.getWorldPointerRayToRef(ray);
        // let sphereCollider = MeshBuilder.CreateSphere("sphere", { diameter: 0.1 }, scene);
        // sphereCollider.position = ray.origin;
        //const controllerMesh = motionController.rootMesh;
        //controllerMesh.addChild(sphereCollider, false);
        const squeezeComponent = motionController.getComponentOfType('squeeze')!;
        // scene.onBeforeRenderObservable.add(function () {
        //     //console.log(((motionController as MotionControllerWithGrab).grabbed));
        //     //let currentPos = ray.origin;
        //     //let currentMoveDelta = (motionController as MotionControllerWithGrab).moveDelta || ray.origin;
        //     //console.log((motionController as MotionControllerWithGrab));
        //     //motionController.moveDelta = new Vector3(0,1,2);
        //     //(motionController as MotionControllerWithGrab).moveDelta = new Vector3(0, 0, 1)//currentPos.subtract(currentMoveDelta);
        //     //console.log((motionController as MotionControllerWithGrab).moveDelta);
        //     //console.log(currentHand.handID);
        // });
        squeezeComponent.onButtonStateChangedObservable.add((item) => {

            if (squeezeComponent.pressed && !currentHand.grabbed) {
                console.log("pressed")
                // scene.animationGroups[7].start(false, 1, 1, item.value*10, false);
                currentHand.grabbed = true;
                currentHand.meshGrabbed = scene.getMeshByName('pivot-Cylinder-A');
                controller.getWorldPointerRayToRef(ray);
                //ray.length = 0.25;
                let pickingInfo = scene.pickWithRay(ray);
                let rayHelper = new RayHelper(ray);
                rayHelper.show(scene);
                if (pickingInfo?.hit && pickingInfo.pickedMesh.name.includes('pivot-Cylinder')) {
                    cylinder = scene.getMeshByName(pickingInfo.pickedMesh.name);
                    gotSomething = cylinder?.getBehaviorByName('PointerDrag');
                    console.log("gotCylinder");
                    if (!gotSomething.dragging) {
              
                        scene.onBeforeRenderObservable.add(function () {
                            let getOldPostion = currentHand.lastPosition;
                            console.log(getOldPostion);
                            if (getOldPostion) {
                                controller.getWorldPointerRayToRef(ray);
                                let getNewPosition = ray.origin;
                                if (Math.random() > 0.9) {
                                    //console.log(getNewPosition.subtract(getOldPostion))
                                    console.log(ray.origin);
                                }
                                cylinder.moveWithCollisions(getNewPosition.subtract(getOldPostion));
                            }
                            currentHand.lastPosition = Object.assign({}, ray.origin);

                        })
                        //console.log("raypick")
                        //console.log(pickingInfo);

                        //scene.simulatePointerDown(pickingInfo);
                        //gotSomething.startDrag(undefined, ray, cylinder.position);
                        //console.log(gotSomething.currentDraggingPointerId);
                    }

                }
            } else {
                console.log("Controller: ", (motionController as MotionControllerWithGrab).handID);
                if (cylinder && gotSomething.dragging) {
                    gotSomething.releaseDrag();
                    cylinder = null;
                    gotSomething = null;
                }
                console.log("ITEM: ", item);
                if ((motionController as MotionControllerWithGrab).handID === "left") {
                    scene.animationGroups[0].goToFrame(item.value*10);
                } else if ((motionController as MotionControllerWithGrab).handID === "right") {
                    scene.animationGroups[7].goToFrame(item.value*10);
                }
                currentHand.grabbed = false;
                currentHand.meshGrabbed = undefined;
            }
        })
    })
})
}
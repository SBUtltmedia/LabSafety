import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";
import { Color3, Engine, Mesh, Nullable, WebXRDefaultExperience } from "@babylonjs/core";
import { CYLINDER_MESH_NAME, MotionControllerWithGrab, sop } from "./Constants";
import { Cylinder } from "./Cylinder";
import { getChildMeshByName, resetPosition, resetRotation } from "./utils";
import { Hand } from "./Hand";
import { GUIManager } from "./GUIManager";
import { SoundManager } from "./SoundManager";

export function addXRBehaviors(scene: Scene, xrCamera: WebXRDefaultExperience, 
    addHandModels: any, cylinders: Array<Cylinder>, 
    guiManager: GUIManager, soundManager: SoundManager) {

    let handRight: Hand = new Hand("right", scene, cylinders, guiManager, soundManager, xrCamera);
    let handLeft: Hand = new Hand("left", scene, cylinders, guiManager, soundManager, xrCamera);
    let isHolding: boolean = false;
    let currentAction = null;
    let handTable = {
        "right": handRight,
        "left": handLeft
    };

    let rotationFlag: boolean = false;

    function getCylinderInstanceFromMesh(cylinder) {
        let name = cylinder.name.split("-")[2];
        //// console.log("Name: ", name);
        for (let instance of cylinders) {
            // // console.log("Instance name: ", instance.name);
            if (instance.name == name) {
                return instance;
            }
        }
        return null;
    }
    let controllerObservable = controller => {
        addHandModels(controller);
        controller.onMotionControllerInitObservable.add(
            motionController => {
                let currentHand = (motionController as MotionControllerWithGrab);
                currentHand.handID = motionController.handedness;

                let currentHandClass: Hand = handTable[currentHand.handedness];

                if (!currentHandClass.getMotionController()) {
                    currentHandClass.setMotionController(currentHand);
                }

                let ray = new Ray(Vector3.Zero(), Vector3.Zero(), 0.25);

                const squeezeComponent = motionController.getComponentOfType('squeeze');
                const triggerComponent = motionController.getComponentOfType('trigger');
                const thumbstick = motionController.getComponentOfType('thumbstick');

                thumbstick.onAxisValueChangedObservable.add(() => {
                    xrCamera.baseExperience.camera.position.y = xrCamera.baseExperience.camera.realWorldHeight;
                });

                xrCamera.baseExperience.camera.onAfterCameraTeleport.add(() => {
                    // console.log("End teleport")
                    xrCamera.baseExperience.camera.position.y = xrCamera.baseExperience.camera.realWorldHeight;
                })

                console.log("Motion controller: ", motionController);

                [triggerComponent].forEach((component) => {
                    component.onButtonStateChangedObservable.add((item) => {
                    if (item.value > 0.3 && currentHand.handID === "right") {
                        xrCamera.pointerSelection.displayLaserPointer = true;
                        xrCamera.pointerSelection.displaySelectionMesh = true;                        
                    } else {
                        xrCamera.pointerSelection.displayLaserPointer = false;
                        xrCamera.pointerSelection.displaySelectionMesh = false;
                    }
                })});

                // console.log();

                [squeezeComponent].forEach((component) => {

                    let hit = "resetRotateAroundZleft";

                    // console.log(scene.getMeshByName("left"));
                    component.onButtonStateChangedObservable.add((item) => {
                        // if (currentAction && currentAction.type != item.type) { return }
                        currentAction = item;

                        // console.log(currentAction);
                        // @ts-ignore
                        let grabSetInterval;
                        let animationMap = { "left": "Fist", "right": "Grip" }

                        // @ts-ignore
                        let currentAnimation = scene.animationGroups.find((animation, idx) => {
                            // @ts-ignore
                            return animation.name === `${currentHandClass.motionController.handID}_${animationMap[currentHandClass.motionController.handID]}`;
                        });

                        // @ts-ignore
                        currentAnimation.goToFrame(item.value * (currentAnimation._to - 1) + 1);
                        // @ts-ignore
                        let grabbedCylinder = currentHandClass.intersectHandCylinder(scene.getMeshByName(currentHand.handID));

                        // // console.log("Grabbed Cylinder: ", grabbedCylinder);

                        let prevPos;
                        let rotateTimeout;

                        if (item.value > 0.5 && !currentHandClass.motionController.grabbed) {

                            if (grabbedCylinder && grabbedCylinder.isPickable) {
                                Engine.audioEngine.unlock();
                                isHolding = false;
                                currentHandClass.holdingMesh = grabbedCylinder;
                                currentHandClass.holdingInstance = getCylinderInstanceFromMesh(currentHandClass.holdingMesh);
                                currentHandClass.motionController.meshGrabbed = currentHandClass.holdingMesh;
                                currentHandClass.motionController.grabbed = true;

                                let getOldPostion = currentHandClass.motionController.lastPosition;
                                let getNewPosition = ray.origin;

                                if (getNewPosition != getOldPostion) {
                                    currentHandClass.disappearAnimation(true);
                                    
                                    grabSetInterval = setInterval(() => {
                                        let getOldPostion = currentHandClass.motionController.lastPosition;
                                        // // console.log(getOldPostion, getNewPosition);                                    
                                        controller.getWorldPointerRayToRef(ray);
                                        if (getOldPostion && currentHandClass.holdingMesh) {
                                            currentHandClass.moveWithCollisions(currentHandClass.holdingMesh, getNewPosition.subtract(getOldPostion));
                                        }

                                        //@ts-ignore
                                        if (!currentHandClass.intersectHandCylinder(scene.getMeshByName(currentHandClass.motionController.handID)) && currentHandClass.holdingMesh && currentHandClass.holdingInstance.rotateEnd) {
                                            if (currentHandClass.targetMeshInstance) {
                                                currentHandClass.targetMeshInstance.highlight(false);
                                            }
                                            currentHandClass.dropped(grabSetInterval);
                                            currentHandClass.motionController.grabbed = false;
                                            currentHandClass.handMesh.visibility = 1;
                                            isHolding = true;
                                            rotationFlag = false;
                                        }


                                        if (currentHandClass.holdingMesh) {
                                            let hitDetected = false;
                                            let collidedCylinder = currentHandClass.intersectCylinder(currentHandClass.holdingMesh);

                                            // console.log(collidedCylinder);

                                            if (collidedCylinder) {
                                                hitDetected = true;
                                                currentHandClass.targetMesh = collidedCylinder;
                                                currentHandClass.targetMeshInstance = getCylinderInstanceFromMesh(collidedCylinder);

                                                currentHandClass.highlightCylinders(currentHandClass.holdingInstance, currentHandClass.targetMeshInstance);

                                                if (currentHandClass.targetMesh.position.x > currentHandClass.holdingMesh.position.x) {
                                                    hit = "resetRotateAroundZright";
                                                }

                                                let to = collidedCylinder.name.split('-')[2];
                                                let from = currentHandClass.holdingMesh.name.split('-')[2];
                                                if (!rotationFlag) {
                                                    rotationFlag = true;
                                                    rotateTimeout = setTimeout(() => {
                                                        currentHandClass.addColors(currentHandClass.holdingInstance, currentHandClass.targetMeshInstance);
                                                        isHolding = currentHandClass.updateSOPTask(from, to, grabSetInterval);

                                                        if (currentHandClass.holdingMesh) {
                                                            prevPos = Object.assign({}, currentHandClass.holdingMesh.position);
                                                        }

                                                        currentHandClass.RotateCylinders(currentHandClass.holdingInstance,
                                                            currentHandClass.targetMeshInstance,
                                                            currentHandClass);
                                                    }, 800);
                                                    // console.log(rotateTimeout);
                                                }
                                            } else {
                                                hitDetected = false;
                                                // console.log(rotateTimeout);
                                                if (rotateTimeout) {
                                                    // console.log("Clearing timeout");
                                                    clearTimeout(rotateTimeout);
                                                    if (currentHandClass.targetMeshInstance) {
                                                        currentHandClass.targetMeshInstance.highlight(false);
                                                    }
                                                    currentHandClass.holdingInstance.highlight(false);
                                                    rotationFlag = false;

                                                    if (currentHandClass.holdingMesh.rotation.z != 0 && prevPos && Math.abs(prevPos._x - currentHandClass.holdingMesh.position.x) > 0.2) {
                                                        // console.log("Here!");
                                                        if (currentHandClass.targetMeshInstance) {
                                                            currentHandClass.targetMeshInstance.highlight(false);
                                                        }
                                                        currentHandClass.holdingInstance.highlight(false);
                                                        currentHandClass.holdingInstance.rotateAnimation(hit, currentHandClass, true);
                                                        rotationFlag = false;
                                                    }                                                    
                                                }
                                            }
                                        }

                                        if (!isHolding && currentHandClass.holdingInstance && currentHandClass.holdingInstance.rotateEnd) {
                                            // // console.log("Here")
                                            currentAction = null;
                                            currentHandClass.motionController.lastPosition = Object.assign({}, ray.origin);
                                            currentHand.lastPosition = Object.assign({}, ray.origin);
                                        }
                                    }, 10)
                                }
                            }
                        } else if ((!item.value || !grabbedCylinder) && currentHandClass.holdingMesh && currentHandClass.holdingInstance.rotateEnd) {
                            currentAction = null;
                            currentHandClass.holdingInstance.highlight(false);
                            currentHandClass.motionController.grabbed = false;
                            if (currentHandClass.targetMeshInstance)
                                currentHandClass.targetMeshInstance.highlight(false);

                            currentHandClass.dropped(grabSetInterval);
                            currentHandClass.disappearAnimation(false);
                            rotationFlag = false;
                        }
                    })
                })
            }
        )
    }


    return function toggle() {

        let controller = xrCamera.input.onControllerAddedObservable;
        if (controller.hasObservers()) {
            controller.clear()
            // console.log("removed")
        }
        else {
            controller.add(controllerObservable)
            // console.log("added")
        }

    }
}
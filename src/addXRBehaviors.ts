import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";
import { Color3, Mesh, Nullable, WebXRDefaultExperience } from "@babylonjs/core";
import { CYLINDER_MESH_NAME, MotionControllerWithGrab, sop } from "./Constants";
import { Cylinder } from "./Cylinder";
import { getChildMeshByName, resetPosition } from "./utils";
import { Hand } from "./Hand";
import { GUIManager } from "./GUIManager";

export function addXRBehaviors(scene:Scene, xrCamera:WebXRDefaultExperience, handAnimations:any, cylinders:Array<Cylinder>, guiManager: GUIManager) { 

    let handRight: Hand = new Hand("right", scene, cylinders, guiManager);
    let handLeft: Hand = new Hand("left", scene, cylinders, guiManager);
    let droppedFlag: boolean = false;

    let handTable = {
        "right": handRight,
        "left": handLeft
    };

    let rotationFlag = false;

    function getCylinderInstanceFromMesh(cylinder) {
        let name = cylinder.name.split("-")[2];
        console.log("Name: ", name);
        for (let instance of cylinders) {
            console.log("Instance name: ", instance.name);
            if (instance.name == name) {
                return instance;
            }
        }
        return null;
    }

    xrCamera.input.onControllerAddedObservable.add(controller => {
        controller.onMotionControllerInitObservable.add(motionController => {
            let currentHand = (motionController as MotionControllerWithGrab);
            currentHand.handID = motionController.handedness;

            let currentHandClass: Hand = handTable[currentHand.handedness];

            if (!currentHandClass.getMotionController()) {
                currentHandClass.setMotionController(currentHand);
            }

            console.log(currentHandClass);          
            
            let ray = new Ray(Vector3.Zero(), Vector3.Zero(), 0.25);

            const squeezeComponent = motionController.getComponentOfType('squeeze');
            const triggerComponent = motionController.getComponentOfType('trigger');

            [squeezeComponent].forEach((component) => { 
                console.log(scene.getMeshByName("left"));
                component.onButtonStateChangedObservable.add((item) => {
                    // @ts-ignore
                    let grabSetInterval;
                    let animationMap = {"left": "Fist","right": "Grip"}

                    // @ts-ignore
                    let currentAnimation = scene.animationGroups.find((animation, idx) => {
                        // @ts-ignore
                        return animation.name === `${currentHandClass.motionController.handID}_${animationMap[currentHandClass.motionController.handID]}`;
                    });

                    // @ts-ignore
                    currentAnimation.goToFrame(item.value*(currentAnimation._to-1)+1);
                    // @ts-ignore
                    let grabbedCylinder = currentHandClass.intersectHandCylinder(scene.getMeshByName(currentHand.handID));

                    console.log("Grabbed Cylinder: ", grabbedCylinder);

                    if (item.value > 0.5 && !currentHandClass.motionController.grabbed) {
                        if (grabbedCylinder) {
                            droppedFlag = false;
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
                                    // console.log(getOldPostion, getNewPosition);                                    
                                    controller.getWorldPointerRayToRef(ray);
                                    if(getOldPostion && currentHandClass.holdingMesh)  {
                                        currentHandClass.moveWithCollisions(currentHandClass.holdingMesh, getNewPosition.subtract(getOldPostion));
                                    } 
                                
                                    //@ts-ignore
                                    if (!currentHandClass.intersectHandCylinder(scene.getMeshByName(currentHandClass.motionController.handID)) && currentHandClass.holdingMesh) {
                                        if (currentHandClass.targetMeshInstance) {
                                            currentHandClass.targetMeshInstance.highlight(false);
                                        }
                                        currentHandClass.dropped(grabSetInterval);   
                                        currentHandClass.motionController.grabbed = false;      
                                        currentHandClass.handMesh.visibility = 1;         
                                        droppedFlag = true;          
                                    }
                                    
                                    if (currentHandClass.holdingMesh) {
                                        let collidedCylinder = currentHandClass.intersectCylinder(currentHandClass.holdingMesh);

                                        if (collidedCylinder) {
                                            currentHandClass.targetMesh = collidedCylinder;
                                            currentHandClass.targetMeshInstance = getCylinderInstanceFromMesh(collidedCylinder);                                            
                                            let to = collidedCylinder.name.split('-')[2];
                                            let from = currentHandClass.holdingMesh.name.split('-')[2]; 
                                            if (!rotationFlag)
                                                currentHandClass.addColors(currentHandClass.holdingInstance, currentHandClass.targetMeshInstance);
                                            rotationFlag = currentHandClass.highlightAndRotateCylinders(currentHandClass.holdingInstance, currentHandClass.targetMeshInstance, rotationFlag);

                                            droppedFlag = currentHandClass.updateSOPTask(from, to, grabSetInterval);
                                            // rotationFlag = false;
                                        } else {
                                            if (currentHandClass.targetMeshInstance) {
                                                currentHandClass.targetMeshInstance.highlight(false);
                                            }

                                            currentHandClass.holdingInstance.highlight(false);
                                            if (rotationFlag) {
                                                currentHandClass.holdingInstance.resetAroundZ();
                                                resetPosition(getChildMeshByName(currentHandClass.holdingMesh, CYLINDER_MESH_NAME));
                                                rotationFlag = false;
                                            }                                            
                                        }
                                    }
                                    if (!droppedFlag) {
                                        currentHandClass.motionController.lastPosition = Object.assign({}, ray.origin);
                                        currentHand.lastPosition = Object.assign({}, ray.origin);
                                    }
                                }, 10)
                            }
                        }
                    } else if ((!item.value || !grabbedCylinder) && currentHandClass.holdingMesh) {
                        currentHandClass.holdingInstance.highlight(false);
                        currentHandClass.motionController.grabbed = false;
                        if (currentHandClass.targetMeshInstance)
                            currentHandClass.targetMeshInstance.highlight(false);
                        
                        currentHandClass.dropped(grabSetInterval);
                        currentHandClass.disappearAnimation(false);
                    }
                })
            })
        })
    })
}
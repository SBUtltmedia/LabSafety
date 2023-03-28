import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";
import { Mesh, Nullable, WebXRDefaultExperience } from "@babylonjs/core";
import { CYLINDER_MESH_NAME, MotionControllerWithGrab, sop } from "./Constants";
import { Cylinder } from "./Cylinder";
import { getChildMeshByName, resetPosition } from "./utils";
import HighlightBehavior from "./HighlightBehavior";

export function addXRBehaviors(scene:Scene, xrCamera:WebXRDefaultExperience, handAnimations:any, cylinders:Array<Cylinder>) { 

    let cylinderMesh: AbstractMesh;
    let labels = ["A", "B", "C"];
    let hitDetected = false;
    let highlightedCylinder;
    let rotationFlag = false;

    function intersect(mesh) {
       for (let i of labels){
            let cylinder = scene.getMeshByName(`pivot-Cylinder-${i}`);
            if (mesh.intersectsMesh(cylinder, false)) {
                return cylinder;
            }
        }
        return false;   
    }

    function intersectCylinder(sourceCylinder) {
        for (let i of labels) {
            let cylinder = scene.getMeshByName(`pivot-Cylinder-${i}`);
            if (cylinder == sourceCylinder) continue;
            if (sourceCylinder.intersectsMesh(cylinder)) {
                return cylinder;
            }
        }
        return false;
    }

    function highlightAndRotateCylinders(sourceCylinder, targetCylinder) {
            [sourceCylinder, targetCylinder].forEach(cylinderToHighlight){
        

            }
 
            let targetCylinderGlassMesh = 
            let sourceCylinderGlassMesh = getChildMeshByName(sourceCylinder, CYLINDER_MESH_NAME);
    
            highlightedCylinder = targetCylinder;

            let current_x = sourceCylinder.getAbsolutePosition()._x;
            let target_x = targetCylinder.getAbsolutePosition()._x;

            if (target_x < current_x) { // left hit
                console.log("Left hit!");

                sourceCylinder.rotation.y = Math.PI;
                targetCylinder.rotation.y = sourceCylinder.rotation.y;
            } else {
                console.log("Right hit!");
                sourceCylinder.rotation.y = 0;
                targetCylinder.rotation.y = sourceCylinder.rotation.y;
            }
            if (!rotationFlag) {
                rotationFlag = true;
                let label = sourceCylinder.name.split("-")[2];
                let individualAnimation = sourceCylinder.getAnimationByName(`${label}-rotateAroundZ`);

                let sizes = cylinderMesh.getHierarchyBoundingVectors();
                let ySize = sizes.max.y - sizes.min.y;
                let offset = -0.09;
                let xPos = target_x;
                let deltaX = current_x - xPos;

                let sourceCylinderMesh = getChildMeshByName(sourceCylinder, CYLINDER_MESH_NAME);

                if (target_x < current_x) {
                    console.log("Src pos: ", sourceCylinder.position.x);
                    sourceCylinderMesh.position.x = deltaX + offset;
                    sourceCylinderMesh.position.y = ySize - 0.2;
                } else {
                    sourceCylinderMesh.position.x = deltaX - offset;
                    sourceCylinderMesh.position.y = ySize - 0.2;
                }

                if (individualAnimation) {
                    console.log("Label: ", label);
                    scene.beginDirectAnimation(getChildMeshByName(sourceCylinder, CYLINDER_MESH_NAME), [individualAnimation], 0, 60, false, undefined, () => {
                    });        
                }
            }
    
    }

    xrCamera.input.onControllerAddedObservable.add(controller => {
        controller.onMotionControllerInitObservable.add(motionController => {
            let currentHand = (motionController as MotionControllerWithGrab);
            currentHand.handID = motionController.handedness;
            
            let ray = new Ray(Vector3.Zero(), Vector3.Zero(), 0.25);

            const squeezeComponent = motionController.getComponentOfType('squeeze');
            const triggerComponent = motionController.getComponentOfType('trigger');

            function dropped(grabbedObject, grabInterval){

                currentHand.lastPosition = null;
                clearInterval(grabInterval);
                console.log("Dropped test tube");
                currentHand.grabbed = false;
                currentHand.meshGrabbed = undefined;
                console.log("Current hand: ", currentHand);
                console.log(grabbedObject)

                console.log(cylinders);
            
                if (grabbedObject) {
                    let currentCylinder= cylinders.find((aCylinder)=>{
                        console.log(aCylinder, grabbedObject)
                        let grabName = grabbedObject.name.split("-");
                        return aCylinder.name==grabName[grabName.length - 1];
                    })
                    currentCylinder.fadeAndRespawn(100);
                }            
            }

            [triggerComponent, squeezeComponent].forEach((component) => { 
                component.onButtonStateChangedObservable.add((item) => {
                    let grabbedCylinder = intersect(scene.getMeshByName(currentHand.handID));
                    if (item.value > 0  && grabbedCylinder    ) {
                        currentHand.lastPosition =Object.assign({},ray.origin);

                        
                    }

                    // @ts-ignore
                    let handMesh = currentHand.handID;
                    let grabSetInterval;
                    let animationMap={"left": "Fist","right": "Grip"}

                    // @ts-ignore
                    let currentAnimation = scene.animationGroups.find((animation, idx) => {
                        // @ts-ignore
                        return animation.name === `${handMesh}_${animationMap[handMesh]}`;
                    });

                    // @ts-ignore
                    currentAnimation.goToFrame(item.value*(currentAnimation._to-1)+1);
                    // @ts-ignore
                   

                 
                    if (item.value > 0 && !currentHand.grabbed) {
                        if (grabbedCylinder) {
                            cylinderMesh = grabbedCylinder;
                            currentHand.meshGrabbed = cylinderMesh;
                            currentHand.grabbed = true;
                            controller.getWorldPointerRayToRef(ray);
                            currentHand.lastPosition = Object.assign({},ray.origin);

                     

                            let getOldPostion = currentHand.lastPosition;

                            let getNewPosition = ray.origin;
                     
                            if (getNewPosition != getOldPostion) {
                                grabSetInterval = setInterval(() => {
                                    let getOldPostion = currentHand.lastPosition; 
                                    
                                    controller.getWorldPointerRayToRef(ray);

                                    if(getOldPostion && cylinderMesh)  {cylinderMesh.moveWithCollisions(getNewPosition.subtract(getOldPostion))} 
                                
                                    // @ts-ignore
                                    if(!intersect(scene.getMeshByName(handMesh)) && cylinderMesh){
                                        if (highlightedCylinder) {
                                            cylinderMesh.highlight(false);
                                        }                                        
        
                                        dropped(cylinderMesh,grabSetInterval);

                                        cylinderMesh = null;
                                    }
                                    
                                    if (cylinderMesh) {
                                        let collidedCylinder = intersectCylinder(cylinderMesh);
                                        if (collidedCylinder) {
                                            let to = collidedCylinder.name.split('-')[2];
                                            let from = cylinderMesh.name.split('-')[2]; 
                                            let fromAndTo = `${from}to${to}`;
                                            if (sop.tasks[sop.currentState].label === fromAndTo) {
                                                if (sop.tasks[sop.currentState].next === 'complete') {
                                                    window.location.assign('.');
                                                } else {
                                                    sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
                                                }
                                            }                                            
                                            // rotationFlag = false;
                                            highlightAndRotateCylinders(cylinderMesh, collidedCylinder);
                                        } else {
                                            hitDetected = false;
                                            if (highlightedCylinder) {
                                                highlightingTheDrag.unhighlightMesh((getChildMeshByName(highlightedCylinder, CYLINDER_MESH_NAME) as Mesh));
                                            }
                                            highlightingTheDrag.unhighlightMesh((getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME) as Mesh));
                                            let label = cylinderMesh.name.split("-")[2];
                                            let individualAnimation = cylinderMesh.getAnimationByName(`${label}-resetRotateAroundZ`);
                                            if (rotationFlag) {
                                                scene.beginDirectAnimation(getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME), [individualAnimation], 0, 60, false, undefined, () => {
                                                });
                                                resetPosition(getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME));
                                                rotationFlag = false;
                                            }                                            
                                        }
                                    }

                                    currentHand.lastPosition = Object.assign({}, ray.origin);
                                }, 10)
                            }
                        }
                    } else if ((!item.value || !grabbedCylinder) && cylinderMesh) {
                        const highlightingTheDrag = getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME).getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
                        highlightingTheDrag.unhighlightMesh((getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME) as Mesh));
                        if (highlightedCylinder) {
                            highlightingTheDrag.unhighlightMesh((getChildMeshByName(highlightedCylinder, CYLINDER_MESH_NAME) as Mesh));
                        }
                        dropped(cylinderMesh,grabSetInterval);
                        
                        cylinderMesh = null;
                    }
                })
            })
        })
    })
}
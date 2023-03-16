import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Ray } from "@babylonjs/core/Culling/ray";
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { MotionControllerWithGrab, lookupHandModel } from "./Constants";
// import {fadeAndRespawn} from "./Cylinder"

export function addXRBehaviors(scene:Scene, xrCamera:any, handAnimations:any, cylinderPos: any,cylinders:any) { 
    let cylinder: AbstractMesh;
    let gotSomething: PointerDragBehavior;
    let observer;

    function intersect(mesh) {
       for (let i of ["A", "B", "C"]){
        
            let cylinder = scene.getMeshByName(`pivot-Cylinder-${i}`);
            if (mesh.intersectsMesh(cylinder, false)) {
                return cylinder;
            }

        }
        return false; 
        
    }

    xrCamera.input.onControllerAddedObservable.add(controller => {
        controller.onMotionControllerInitObservable.add(motionController => {
            let currentHand = (motionController as MotionControllerWithGrab);
            currentHand.handID = motionController.handedness;
            
            let ray = new Ray(Vector3.Zero(), Vector3.Zero(), 0.25);

            const squeezeComponent = motionController.getComponentOfType('squeeze')!;
            const triggerComponent = motionController.getComponentOfType('trigger');

            function dropped(grabbedObject,grabInterval){

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

            [triggerComponent, squeezeComponent].forEach((component)=>{ 
                component.onButtonStateChangedObservable.add((item) => {
                            // @ts-ignore
                    let handMesh = currentHand.handID;
                    let grabSetInterval;
                    console.log("Trigger pressed: ", item.value)
                    let animationMap={"left": "Fist","right": "Grip"}
                    // @ts-ignore
                    let currentAnimation = scene.animationGroups.find((animation, idx) => {
                        console.log(idx, handMesh);
                        return animation.name === `${handMesh}_${animationMap[handMesh]}`;
                    });
                    console.log(currentAnimation._to);
                    // [animationMap[currentHand.handID]]
                    console.log(scene.animationGroups[0], scene.animationGroups[7]); 
                    // @ts-ignore
                    currentAnimation.goToFrame(item.value*(currentAnimation._to-1)+1);
                    // @ts-ignore
                    let grabbedCylinder = intersect(scene.getMeshByName(currentHand.handID));

                    if (item.value > 0) {
                        currentHand.lastPosition =Object.assign({},ray.origin);
                    }

                    if (item.value > 0 && !currentHand.grabbed) {
                        if (grabbedCylinder) {
                            cylinder = grabbedCylinder;
                            currentHand.meshGrabbed = cylinder;
                            currentHand.grabbed = true;
                            controller.getWorldPointerRayToRef(ray);
                            currentHand.lastPosition = Object.assign({},ray.origin);
    
                            console.log("Current hand: ", currentHand);

                            let getOldPostion = currentHand.lastPosition;

                            let getNewPosition = ray.origin;
                     
                            if (getNewPosition != getOldPostion) {
                                grabSetInterval = setInterval(() => {
                                    let getOldPostion = currentHand.lastPosition; 
                                    
                                    controller.getWorldPointerRayToRef(ray);

                                    if(getOldPostion && cylinder)  {cylinder.moveWithCollisions(getNewPosition.subtract(getOldPostion))} 
                                
                                    // @ts-ignore
                                    if(!intersect(scene.getMeshByName(handMesh)) && cylinder){
                                    console.log(handMesh,cylinder)
                                    dropped(cylinder,grabSetInterval);
                                    cylinder = null;
                                    }
                                
                                    currentHand.lastPosition = Object.assign({}, ray.origin);
                                }, 10)
                            }
                        }
                    } else if ((!item.value || !grabbedCylinder) && cylinder) {
                        console.log(handMesh,cylinder)
                        dropped(cylinder,grabSetInterval);
                        cylinder = null;
                    }
                })
            })
        })
    })
}
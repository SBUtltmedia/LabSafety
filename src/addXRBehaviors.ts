import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Ray } from "@babylonjs/core/Culling/ray";
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import {lookupHandModel} from './constants';
import { MotionControllerWithGrab } from "./Constants";
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
           // controller.getWorldPointerRayToRef(ray);
            // let sphereCollider = MeshBuilder.CreateSphere("sphere", { diameter: 0.1 }, scene);
            // sphereCollider.position = ray.origin;
            //const controllerMesh = motionController.rootMesh;
            //controllerMesh.addChild(sphereCollider, false);
            const squeezeComponent = motionController.getComponentOfType('squeeze')!;
            const triggerComponent = motionController.getComponentOfType('trigger');
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
                
           //  grabbedObject.position = cylinderPos[cylinder.name];
                grabbedObject = undefined;
            
            }
            [triggerComponent, squeezeComponent].forEach((component)=>{ 
                component.onButtonStateChangedObservable.add((item) => {
                            // @ts-ignore
                    let handMesh= lookupHandModel[currentHand.handID]
                    let grabSetInterval;
                    console.log("Trigger pressed: ", item.value)
                    let animationMap={"left": 0,"right": 7}
                    // @ts-ignore
                    let currentAnimation = scene.animationGroups[animationMap[currentHand.handID]]
                    console.log(currentAnimation) 
                    // @ts-ignore
                    currentAnimation.goToFrame(item.value*(currentAnimation._to-1)+1);
                    // @ts-ignore
                    let grabbedCylinder = intersect(scene.getMeshByName(lookupHandModel[currentHand.handID]));
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
                           
                                // observer = scene.onBeforeRenderObservable.add(function () {
                                    grabSetInterval= setInterval(() => {

                                    let getOldPostion = currentHand.lastPosition; 
                                    // console.log(getOldPostion);
                                  
                                        controller.getWorldPointerRayToRef(ray);
                                      //  let curPos =Object.assign({},cylinder.position);
                                   // cylinder.position = ray.origin;
                                   if(getOldPostion)  {cylinder.moveWithCollisions(getNewPosition.subtract(getOldPostion))} 
                              
                                    // @ts-ignore
                                  if(!intersect(scene.getMeshByName(handMesh))){
                                    console.log(handMesh,cylinder)
                                    dropped(cylinder,grabSetInterval);
                                  }
                                
                                   currentHand.lastPosition = Object.assign({}, ray.origin);
                                }, 10)
                            }
                        }
                    } else if ((!item.value || !grabbedCylinder)) {
                        console.log(handMesh,cylinder)
                        dropped(cylinder,grabSetInterval);
                    }
                })
            })
        })
    })
}
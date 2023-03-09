import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Ray } from "@babylonjs/core/Culling/ray";
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import {lookupHandModel} from './constants';
import { MotionControllerWithGrab } from "./Constants";

export function addXRBehaviors(scene:Scene, xrCamera:any, handAnimations:any, cylinderPos: any) { 
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
            controller.getWorldPointerRayToRef(ray);
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

            [triggerComponent, squeezeComponent].forEach((component)=>{ 
                component.onButtonStateChangedObservable.add((item) => {
                    console.log(item)

                    if(!component.pressed){
                    
                    }
                    console.log("Trigger pressed: ", item.value)
                    let animationMap={"left": 0,"right": 7}
                    let targetFrame;
                    let currentAnimation = scene.animationGroups[animationMap[currentHand.handID]]
                    console.log(currentAnimation) 
                    if (item.value) {
                        targetFrame = item.value*currentAnimation._to
                    }
                     else{
                        targetFrame = 1; 
                    }
                    currentAnimation.goToFrame(targetFrame);
                    

                    if (item.value && !currentHand.grabbed) {
                        if(!currentHand.lastPosition) {
                             currentHand.lastPosition =Object.assign({},ray.origin);
                        }

                        console.log("Cylinder inside: ", cylinder)

                        currentHand.grabbed = true;
                        controller.getWorldPointerRayToRef(ray);

                        console.log("Current hand: ", currentHand);
                        
                        let grabbedCylinder = intersect(scene.getMeshByName(lookupHandModel[currentHand.handID]));

                        if (grabbedCylinder) {
                            cylinder = grabbedCylinder;
                            let getOldPostion = currentHand.lastPosition;

                            let getNewPosition = ray.origin;
                            // let sphereCollider = MeshBuilder.CreateSphere("sphere", { diameter: 0.1 }, scene);

                            // sphereCollider.position = ray.origin;                        

                            if (getNewPosition != getOldPostion) {
                                // observer = scene.onBeforeRenderObservable.add(function () {
                                    observer = setInterval(() => {
                                    let getOldPostion = currentHand.lastPosition;
                                    // console.log(getOldPostion);
                                    if (getOldPostion) {
                                        controller.getWorldPointerRayToRef(ray);
                                        let getNewPosition = ray.origin;
                                      //  let curPos =Object.assign({},cylinder.position);
                                        cylinder.position = ray.origin;
                                       // cylinder.moveWithCollisions(getNewPosition.subtract(getOldPostion));
                                    }
                                   currentHand.lastPosition = Object.assign({}, ray.origin);
                                }, 10)
                            }
                        }


                        // let pickingInfo = scene.pickWithRay(ray);
                        // let rayHelper = new RayHelper(ray);
                        // rayHelper.show(scene);

                        // console.log(pickingInfo);
                        // // If we pickup a cylinder
                        // if (pickingInfo?.hit && pickingInfo.pickedMesh.name.includes('pivot-Cylinder')) {
                        //     cylinder = scene.getMeshByName(pickingInfo.pickedMesh.name);
                        //     currentHand.meshGrabbed = cylinder;

                        //     console.log("Mesh grabbed: ", currentHand.meshGrabbed);
                        //     console.log("Pressed: ", item.value);
                        //     console.log("Grabbed: ", currentHand.grabbed);
                        //     console.log("Got something: ", gotSomething);                    
        

                        //     console.log("grabbed cil: ", cylinder);

                        //    // gotSomething = cylinder?.getBehaviorByName('PointerDrag');
                        //   //  console.log("gotCylinder");
                        //     let getNewPosition = ray.origin;
                        //     // let sphereCollider = MeshBuilder.CreateSphere("sphere", { diameter: 0.1 }, scene);

                        //     // sphereCollider.position = ray.origin;

                        //     let getOldPostion = currentHand.lastPosition;

                        //     if (getNewPosition != getOldPostion) {
                        //         // observer = scene.onBeforeRenderObservable.add(function () {
                        //             observer = setInterval(() => {
                        //             let getOldPostion = currentHand.lastPosition;
                        //             // console.log(getOldPostion);
                        //             if (getOldPostion) {
                        //                 controller.getWorldPointerRayToRef(ray);
                        //                 let getNewPosition = ray.origin;
                        //               //  let curPos =Object.assign({},cylinder.position);
                        //                 cylinder.position =ray.origin;
                        //                // cylinder.moveWithCollisions(getNewPosition.subtract(getOldPostion));
                        //             }
                        //            currentHand.lastPosition = Object.assign({}, ray.origin);
                        //         }, 10)
                        //     }
                        // }
                    } else if (!item.value) {
                        // scene.onBeforeRenderObservable.remove(observer);
                        // cylinder = undefined;
                        currentHand.lastPosition = null;
                        clearInterval(observer);
                        console.log("Dropped test tube");
                        currentHand.grabbed = false;
                        currentHand.meshGrabbed = undefined;
                        console.log("Current hand: ", currentHand);
                        console.log(scene.getMeshByName("pivot-Cylinder-A").position)
                        if (cylinder) {
                            cylinder.position = cylinderPos[cylinder.name];
                            cylinder = undefined;
                        }
                    }
                })
            })
        })
    })
}
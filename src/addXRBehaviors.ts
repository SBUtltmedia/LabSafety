import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";
import { WebXRDefaultExperience } from "@babylonjs/core";
import { MotionControllerWithGrab} from "./Constants";
import { Cylinder } from "./Cylinder";

export function addXRBehaviors(scene:Scene, xrCamera:WebXRDefaultExperience, handAnimations:any, cylinders:Array<Cylinder>) { 

    let cylinder: AbstractMesh;
    let labels = ["A", "B", "C"];

    function intersect(mesh) {
       for (let i of labels){
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
                    // @ts-ignore
                    let handMesh = currentHand.handID;
                    let grabSetInterval;
                    let animationMap={"left": "Fist","right": "Grip"}

                    // @ts-ignore
                    let currentAnimation = scene.animationGroups.find((animation, idx) => {
                        console.log(idx, handMesh);
                        // @ts-ignore
                        return animation.name === `${handMesh}_${animationMap[handMesh]}`;
                    });

                    //@ts-ignore
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
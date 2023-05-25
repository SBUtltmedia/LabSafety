import { Color3, Vector3, WebXRDefaultExperience, WebXRState } from "@babylonjs/core";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import { Cylinder } from "./Cylinder";
// import '@babylonjs/core/Materials/Node/Blocks';

export function addWebXR(scene: Scene, xrCamera:WebXRDefaultExperience, cylinders: Array<Cylinder>) {

    let handAnimations;
    let addHandModels;
     return new Promise((resolve)=> {

        // const MODEL_BASE_URL = "https://cdn.aframe.io/controllers/hands/";
        // let glbSuffix = "HandHigh";

        const MODEL_BASE_URL = "./models/";
        let glbSuffix = ""; 

        var models = {};

        let model_names = ["left", "right"];

        const assetsManager = new AssetsManager(scene);
        model_names.forEach((name) => {
            assetsManager.addMeshTask(`load ${name} hand`, "", MODEL_BASE_URL, `${name}${glbSuffix}.glb`);
        })

        let idx = 0;

        assetsManager.onTaskSuccess = (task) => { 
            
            models[model_names[idx]] = task["loadedMeshes"][1];
            task["loadedMeshes"][1].name = model_names[idx];

            handAnimations = task["loadedAnimationGroups"];
            for (let i = 0; i <  handAnimations.length; i++) {
                handAnimations[i].name = `${model_names[idx]}_${handAnimations[i].name}`;

            }        
            idx++;

        }
        assetsManager.onTasksDoneObservable.add(() => {
            for (let i = 0; i < scene.animationGroups.length; i++) {
                scene.animationGroups[i].pause();
            }
            
            // xrCamera.pointerSelection.detach();
                addHandModels= (webXrInputSource) => {
                    console.log(webXrInputSource)
                let handedness=webXrInputSource.inputSource.handedness;
                console.log(models[handedness])
                let controllerMesh = models[handedness].parent.parent;
                
                models[handedness].isPickable = false;

                for (let cylinder of cylinders) {
                    cylinder.removeDragCollision();
                }        

                let sign =((Object.keys(models).indexOf(handedness))-1)*2-1;

                models[handedness].rotation.y = Math.PI*sign;
                models[handedness].rotation.z = -Math.PI/2;
                models[handedness].rotation.x = -Math.PI / 4;
                controllerMesh.parent = webXrInputSource.grip || webXrInputSource.pointer;

            }
           // xrCamera.input.onControllerAddedObservable.add(addHandModel);
            

            xrCamera.baseExperience.onStateChangedObservable.add((state) => {
                if (state === WebXRState.IN_XR) {
                    xrCamera.baseExperience.camera.position.y = 1.5;
                    xrCamera.baseExperience.camera.position.z = -0.5;

                    let screen = scene.getMeshByName("Start");
                    if (screen) {
                        let camera = xrCamera.baseExperience.camera;
                        screen.parent = camera
                        screen.position = camera.position.add(new Vector3(-camera.position.x, -1.5, 1.15));

                        xrCamera.pointerSelection.displayLaserPointer = true;
                        xrCamera.pointerSelection.displaySelectionMesh = true;

                        // screen.position.x = 0;
                        // screen.position.y = 0;
                        // screen.position.z = 1.65;

                        screen.rotation = Vector3.Zero();
                    }

                }
            });

            xrCamera.baseExperience.camera.onAfterCameraTeleport.add((targetPos) => {
                xrCamera.baseExperience.camera.position.y = 0.5;
            })
            
        })
        assetsManager.loadAsync().then(()=>{
            resolve(addHandModels)
        });
   })
   
}
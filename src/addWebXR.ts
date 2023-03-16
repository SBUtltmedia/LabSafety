import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import {lookupHandModel} from './Constants';
export function addWebXR(scene: Scene,xrCamera:any) {

    let handAnimations;

   return new Promise((resolve)=>{

    // const MODEL_BASE_URL = "https://cdn.aframe.io/controllers/hands/";
    // let glbSuffix = "HandHigh";

    const MODEL_BASE_URL = "./models/";
    let glbSuffix = ""; 

    var models = {};

    let model_names = ["left", "right"];

   
    // let glbSuffix = "";    
   
    const assetsManager = new AssetsManager(scene);
    model_names.forEach((name) => {
        assetsManager.addMeshTask(`load ${name} hand`, "", MODEL_BASE_URL, `${name}${glbSuffix}.glb`);
    })

    let idx = 0;

    assetsManager.onTaskSuccess = (task) => {    
      
        // if (models.length == 0) {
        //     task.loadedMeshes[0].setEnabled(false);
        //     models[task.loadedMeshes[0].name] = task.loadedMeshes[0];
        // } else {
        //     task.loadedMeshes[1].setEnabled(false);
        console.log(task);

        // for(let [idx, model] of task.loadedMeshes.entries()){
        //     console.log(idx, model);
        //     models[model_names[idx]] = model;
        // }
        
        console.log(task.loadedMeshes);
        // for(let model of task.loadedMeshes){
        //     models[model.name] = model;
        //     console.log(model.name);
        //     console.log(idx);
        //     idx++;
        // }
        
        models[model_names[idx]] = task.loadedMeshes[1];
        task.loadedMeshes[1].name = model_names[idx];

        console.log("MODELS new code: ", models);

        //this.handAnimation[task.loadedMeshes[1].name] = "g";
        handAnimations = task.loadedAnimationGroups;
        for (let i = 0; i < task.loadedAnimationGroups.length; i++) {
            task.loadedAnimationGroups[i].name = `${model_names[idx]}_${task.loadedAnimationGroups[i].name}`;
            // scene.animationGroups[i].pause();
        }        
        console.log("Scene animation groups: ", scene.animationGroups);
        idx++;

// for(let animation of scene.animationGroup){
//     animation.pause();
// }

    }
    assetsManager.onTasksDoneObservable.add( () =>{

        for (let i = 0; i < scene.animationGroups.length; i++) {
            // scene.animationGroups[i].name = "blah_" + scene.animationGroups[i].name;
            scene.animationGroups[i].pause();
        }
     
     // scene.animationGroups[7].pause();
     
     xrCamera.pointerSelection.detach();
     
     xrCamera.input.onControllerAddedObservable.add((webXrInputSource) => {
        let handedness=webXrInputSource.inputSource.handedness;
        console.log(models[handedness])
        let controllerMesh = models[handedness].parent.parent;//.createInstance(`${handedness}Controller`);
        
        models[handedness].isPickable = false;

        console.log(controllerMesh);

        let sign =((Object.keys(models).indexOf(handedness))-1)*2-1;
        console.log( models[handedness])
        models[handedness].rotation.y = Math.PI*sign;
        models[handedness].rotation.z = 0;
        models[handedness].rotation.x = -Math.PI / 4;
        controllerMesh.parent = webXrInputSource.grip || webXrInputSource.pointer;
    
     });
        
        
         // const controllerFeature = xrCamera.baseExperience.featuresManager.enableFeature(WebXRControllerPointerSelection.Name, "latest")
         // controllerFeature.displayLaserPointer = false;
         // console.log(xrCamera.baseExperience.featuresManager.);
         //enableXRGrab(xr.input);
        })

   
    assetsManager.loadAsync().then(()=>{
        resolve(handAnimations)
    });
   })


   
}
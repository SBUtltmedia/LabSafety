import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";

export function addWebXR(scene: Scene,xrCamera:any) {

    let handAnimations;

   return new Promise((resolve)=>{

    const MODEL_BASE_URL = "./models/";
    const MODEL_LEFT_FILENAME = "left.glb";
    const MODEL_RIGHT_FILENAME = "right.glb";
    var models = {};
    let lookupHandModel={"right":"handR2320","left":"handL2320"}
    const assetsManager = new AssetsManager(scene);
    assetsManager.addMeshTask("load left hand", "", MODEL_BASE_URL, MODEL_LEFT_FILENAME);
    assetsManager.addMeshTask("load right hand", "", MODEL_BASE_URL, MODEL_RIGHT_FILENAME);  
    assetsManager.onTaskSuccess = (task) => {

        console.log("Task:", task.loadedMeshes[0])
      
      
      
        // if (models.length == 0) {
        //     task.loadedMeshes[0].setEnabled(false);
        //     models[task.loadedMeshes[0].name] = task.loadedMeshes[0];
        // } else {
        //     task.loadedMeshes[1].setEnabled(false);
        for(let model of task.loadedMeshes){
        models[model.name] = model;
        }

        console.log("MODELS: ", models);

        //this.handAnimation[task.loadedMeshes[1].name] = "g";
        handAnimations = task.loadedAnimationGroups;
        console.log("Scene animation groups: ", scene.animationGroups);
// for(let animation of scene.animationGroup){
//     animation.pause();
// }

    }
    assetsManager.onTasksDoneObservable.add( () =>{

        for (let i = 0; i < scene.animationGroups.length; i++) {
         scene.animationGroups[i].pause();
     }
     
     // scene.animationGroups[7].pause();
     
     xrCamera.pointerSelection.detach();
     
     xrCamera.input.onControllerAddedObservable.add((webXrInputSource) => {
        let handedness=webXrInputSource.inputSource.handedness;
        let controllerMesh = models[lookupHandModel[handedness]].parent.parent//.createInstance(`${handedness}Controller`);
        
        models[lookupHandModel[handedness]].isPickable = false;

        console.log(controllerMesh);

        let sign =((Object.keys(models).indexOf(lookupHandModel[handedness]))-1)*2-1;
        console.log( models[lookupHandModel[handedness]])
        models[lookupHandModel[handedness]].rotation.y = Math.PI*sign;
        models[lookupHandModel[handedness]].rotation.z = 0;
        models[lookupHandModel[handedness]].rotation.x = -Math.PI / 4;
        controllerMesh.parent = webXrInputSource.grip || webXrInputSource.pointer;
         
         // webXrInputSource.inputSource.handedness;
         // if (webXrInputSource.inputSource.handedness === "left") {
         //     console.log("left controller found");
         //     var leftControllerMesh = models["handL2320"].createInstance("leftController");
         //     leftControllerMesh.rotation.y = Math.PI;
         //     leftControllerMesh.rotation.z = 0;
         //     leftControllerMesh.rotation.x = -Math.PI / 4;
         //     leftControllerMesh.parent = webXrInputSource.grip || webXrInputSource.pointer;
         // }
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
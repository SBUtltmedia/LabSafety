import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";

export function addWebXR(scene: Scene,xrCamera:any) {

    let handAnimations;

   return new Promise((resolve)=>{

    const MODEL_BASE_URL = "./models/";
    const MODEL_LEFT_FILENAME = "left2.glb";
    const MODEL_RIGHT_FILENAME = "left2.glb";
    var models = {};
    const assetsManager = new AssetsManager(scene);
    assetsManager.addMeshTask("load left hand", "", MODEL_BASE_URL, MODEL_LEFT_FILENAME);
    assetsManager.addMeshTask("load right hand", "", MODEL_BASE_URL, MODEL_RIGHT_FILENAME);
    assetsManager.onTaskSuccess = (task) => {
        console.log(task)
        task.loadedMeshes[1].setEnabled(false);
        models[task.loadedMeshes[1].name] = task.loadedMeshes[1];
        //this.handAnimation[task.loadedMeshes[1].name] = "g";
        handAnimations=  task.loadedAnimationGroups;
       // scene.stopAllAnimations();
       
        xrCamera.pointerSelection.detach();
    
        xrCamera.input.onControllerAddedObservable.add((webXrInputSource) => {
            if (webXrInputSource.inputSource.handedness === "right") {
                console.log("right controller found");
                var rightControllerMesh = models["handR2320"].createInstance("rightController");
                rightControllerMesh.rotation.y = Math.PI / 2;
                rightControllerMesh.rotation.z = -0.8;
                rightControllerMesh.parent = webXrInputSource.grip || webXrInputSource.pointer;
            }
            webXrInputSource.inputSource.handedness;
            if (webXrInputSource.inputSource.handedness === "left") {
                console.log("left controller found");
                var leftControllerMesh = models["handR2320"].createInstance("leftController");
                leftControllerMesh.rotation.y = Math.PI / 2;
                leftControllerMesh.rotation.z = 0.8;
                leftControllerMesh.parent = webXrInputSource.grip || webXrInputSource.pointer;
            }
        });
    };
   assetsManager.loadAsync().then(()=>{

    resolve(handAnimations)
   });


   })

   
   
    // const controllerFeature = xrCamera.baseExperience.featuresManager.enableFeature(WebXRControllerPointerSelection.Name, "latest")
    // controllerFeature.displayLaserPointer = false;
    // console.log(xrCamera.baseExperience.featuresManager.);
    //enableXRGrab(xr.input);

}
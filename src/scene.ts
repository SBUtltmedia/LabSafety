import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Light } from "@babylonjs/core/Lights/light";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { WebXRDefaultExperience, WebXRDefaultExperienceOptions } from "@babylonjs/core/XR/webXRDefaultExperience";

import { MAX_XR_GRAB_DISTANCE } from "./Constants";
import { enableTasks } from "./enableTasks";
import { InteractionXRManager } from "./InteractionXRManager";
import { loadMeshes } from "./loadMeshes";
import { placeCamera } from "./placeCamera";
import { placeMeshes } from "./placeMeshes";
import { processMeshes } from "./processMeshes";
import { setUpCamera } from "./setUpCamera";
import { setUpScene } from "./setUpScene";
import { setUpXR } from "./setUpXR";
import { log } from "./utils";

export let xrExperience: WebXRDefaultExperience;
export let interactionXRManager: InteractionXRManager;

export async function createSceneAsync(engine: Engine): Promise<Scene> {
    log("createSceneAsync start");
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const scene = new Scene(engine);
    const camera = new UniversalCamera("camera", new Vector3(0, 1, -1.134), scene);
    const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

    setUpScene(scene, true);
    setUpCamera(camera);
    scene.activeCamera = camera;
    scene.activeCamera.attachControl(true);

    // Enable audio
    Engine.audioEngine.useCustomUnlockedButton = true;
    
    light1.intensity = 0;

    log("createSceneAsync start WebXR initialization");
    const xrOptions: WebXRDefaultExperienceOptions = {
        inputOptions: {
            // doNotLoadControllerMeshes: true
        },
        pointerSelectionOptions: {
            enablePointerSelectionOnAllControllers: true,
            maxPointerDistance: MAX_XR_GRAB_DISTANCE
        }
    };

    xrExperience = await scene.createDefaultXRExperienceAsync(xrOptions);
    interactionXRManager = new InteractionXRManager(xrExperience);
    setUpXR(xrExperience);
    
    const splashScreen = document.querySelector("div.splash");
    splashScreen.textContent = "Click to start!";
    splashScreen.addEventListener("click", () => {
        splashScreen.classList.add("hide");
    }, false);
    log("createSceneAsync end WebXR initialization");

    // Imports the meshes and renames the "__root__" mesh names and ids to the filename (minus the file extension).
    // Results is an array of results, where each element is the result from importing a particular file.
    const results = await loadMeshes();
    // Flatten the mesh so we have a single-dimensional array of all the meshes in the scene.
    // It might be that we don't need the results from loadMeshes() at all, because we could just retrieve the
    // meshes from the Scene object. I don't see much reason to do one in favor of the other.
    const meshes = results.map(result => result.meshes).flat() as Mesh[];

    // Establishes behaviors, observables, hooks, materials, etc. to each mesh. Does not move or rotate.
    processMeshes(meshes);
    
    // Places meshes to their proper places in the scene, including rotation.
    placeMeshes(meshes);

    // Places the camera at the starting position.
    placeCamera(camera);

    xrExperience.teleportation.addFloorMesh(scene.getMeshByName("Floor"));

    fadeIn(light1);
    
    log("createSceneAsync enable tasks start");
    enableTasks(scene);
    log("createSceneAsync enable tasks end");
    log("createSceneAsync end");
    return scene;
}

export function pauseAnimations(scene: Scene) {
    scene.animationGroups?.forEach(animGroup => animGroup.pause());
}

function fadeIn(light: Light) {
    // @todo: This doesn't really belong; it should move. Additionally, maybe an onBeforeRender, with scaling based on framerate, instead of
    // setInterval, would be better? It's more complex, but better integrated into Babylon (and therefore possibly more stable and performant)
    let fadeInID = setInterval(() => {
        if (light.intensity >= 1) {
            clearInterval(fadeInID);
        } else {
            light.intensity += 0.1;
        }
    }, 60);
}

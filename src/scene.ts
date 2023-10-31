import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { setUpScene } from "./setUpScene";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { setUpCamera } from "./setUpCamera";

import { loadMeshes } from "./loadMeshes";
import { placeMeshes } from "./placeMeshes";
import { placeCamera } from "./placeCamera";
import { processMeshes } from "./processMeshes";
import { SoundManager } from "./SoundManager";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Light, WebXRDefaultExperienceOptions, WebXRState } from "@babylonjs/core";
import { setUpXR } from "./setUpXR";
import { XR } from "./XR";
import FlyToCameraBehavior from "./FlyToCameraBehavior";
import { GUIManager } from "./GUIManager";
import { PostSceneCylinder } from "./PostSceneCylinder";
import { log } from "./utils";

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
    
    light1.intensity = 0;

    // Imports the meshes and renames the "__root__" mesh names and ids to the filename (minus the file extension).
    // Results is an array of results, where each element is the result from importing a particular file.
    const results = await loadMeshes();
    // Flatten the mesh so we have a single-dimensional array of all the meshes in the scene.
    // @todo: It might be that we don't need the results from loadMeshes() at all, because we could just retrieve the
    // meshes from the Scene object. I don't see much reason to do one in favor of the other.
    const meshes = results.map(result => result.meshes).flat() as Mesh[];

    // Establishes behaviors, observables, hooks, materials, etc. to each mesh. Does not move or rotate.
    processMeshes(meshes);
    
    // Places meshes to their proper places in the scene, including rotation.
    placeMeshes(meshes);

    // Places the camera at the starting position.
    placeCamera(camera);

    fadeIn(light1);
    
    const xrOptions: WebXRDefaultExperienceOptions = {
        floorMeshes: [scene.getMeshByName("Floor")],
        inputOptions: {
            // doNotLoadControllerMeshes: true
        }
    };
    log("createSceneAsync start WebXR initialization");
    const xrExperience = await scene.createDefaultXRExperienceAsync(xrOptions);
    setUpXR(xrExperience);
    xrExperience.baseExperience.onStateChangedObservable.add(changePointerLock);
    
    const splashScreen = document.querySelector("div.splash");
    splashScreen.textContent = "Click to start!";
    splashScreen.addEventListener("click", () => {
        splashScreen.classList.add("hide");
        changePointerLock(xrExperience.baseExperience.state);
    }, false);
    canvas.addEventListener("click", () => {
        // @todo: This sometimes fails if it hasn't been long enough since the user exited pointer lock.
        // This should be fixable by adding a listener to the pointer lock state change (see MDN on the
        // Pointer Lock API).
        changePointerLock(xrExperience.baseExperience.state);
    }, false);
    log("createSceneAsync end WebXR initialization");
    // const cylinderMeshes = meshes.filter(mesh => mesh.name.split("-")[0] === "cylinder");
    // const cylinderInstances = cylinderMeshes.map(mesh => )
    // const xr = new XR(scene, xrExperience, null, cylinders, null, this.soundManager, this.fireExtinguisher);
    // xr.addWebXr().then(addHandModels => {
    //     if (xrExperience) {
    //         const flyToCamera = new FlyToCameraBehavior(xrExperience.baseExperience);
    //         const clipboard = scene.getMeshByName("clipboard");
    //         clipboard.addBehavior(flyToCamera);
    //     }
    //     this.guiManager = new GUIManager(scene);
    //     this.guiManager.createPromptWithButton("Welcome to the Lab Safety Simulation. Click on the clipboard to learn more about the simulation!");
    //     xr.guiManager = this.guiManager;
    //     xr.addHandModels = addHandModels;
        
    //     let desktopScene: PostSceneCylinder = new PostSceneCylinder(scene, cylinders, this.guiManager, soundManager, xrExperience, fireExtinguisher);
    //     desktopScene.postSceneCylinder();
    //     const toggleControllers = xr.addWebXrBehaviors();
    // });

    // @todo: Load and enable sounds.
    // @todo: I like the SoundManager implementation in principle, but it seems like it's only really being used to load the sounds and then store them. That can easily be a function, so I think, for simplicity, it should be.
    // I could be persuaded to implement a class if we had more complexity with sounds, but for now we don't. There may also be a Babylonian way to deal with sounds, but I don't know.
    // log("createSceneAsync start sounds");
    // const soundManager = new SoundManager([], scene);
    // soundManager.enableAudio();
    // await soundManager.loadSounds();
    // log("createSceneAsync end sounds");
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

function changePointerLock(state: WebXRState): void {
    if (document.pointerLockElement && state === WebXRState.IN_XR) {
        document.exitPointerLock();
    }
    if (!document.pointerLockElement && state === WebXRState.NOT_IN_XR) {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        canvas.requestPointerLock();
    }
}

import { Scene } from "@babylonjs/core/scene";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Light } from "@babylonjs/core/Lights/light";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { Ellipse } from "@babylonjs/gui";
import { STARTING_POSITION, configureCamera } from "./camera";
import { InteractionManager } from "./interactionManager";
import { loadMeshes, meshMap } from "./loadMeshes";
import { placeCamera } from "./placeCamera";
import { placeMeshes } from "./placeMeshes";
import { processMeshes } from "./processMeshes";
import { log } from "./utils";
import { XR_OPTIONS, configureXR } from "./xr";
import { loadSounds } from "./SoundManager";

import { GameStates } from "./StateMachine";
import { setupGameStates, stateMachine } from "./setupGameStates";
import { GUIButtons } from "./InteractableButtons";
import { finalGameState } from "./GameTasks";
import { Status } from "./Task";
import { Observable } from "@babylonjs/core";
export let xrExperience: WebXRDefaultExperience;
export let interactionManager: InteractionManager;

// Names of meshes not to dispose on scene reset
export const meshesToPreserveNames: string[] = [];
export let grabButton: Ellipse;
export let activateButton: Ellipse;
export let meshesLoaded: Observable<Boolean> = new Observable();

let pointerLockEnabled = true;

export function disablePointerLock(): void {
    pointerLockEnabled = false;
}

export function enablePointerLock(): void {
    pointerLockEnabled = true;
}

export let utilityLayer: UtilityLayerRenderer;

// BAD CODE! FIND A BETTER WAY
let stateMachineFirstTime = false;

export async function createSceneAsync(engine: Engine): Promise<Scene> {
    log("createSceneAsync start");
    const scene = new Scene(engine);
    const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    const camera = new UniversalCamera("camera", STARTING_POSITION);
    const canvas = document.getElementById("canvas");

    let isTouchDevice = false;

    if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.maxTouchPoints > 0)) {
      isTouchDevice = true;
    }

    if (stateMachine) {
        setupGameStates(stateMachine.platform);
    } else {
        setupGameStates(isTouchDevice ? "mobile" : "desktop");  
    }

    stateMachineFirstTime = true;

    configureScene(scene, true);
    configureCamera(camera);
    scene.activeCamera = camera;
    scene.activeCamera.attachControl(canvas, true);
    light1.intensity = 0;

    // Enable audio
    Engine.audioEngine.useCustomUnlockedButton = true;

    // To prevent the reticle clipping through objects in the scene
    utilityLayer = new UtilityLayerRenderer(scene);

    //const reticle=CreateReticle("reticle", utilityLayer.utilityLayerScene);
    // reticle.setParent(camera);
    // reticle.position.copyFrom(Axis.Z);
    // meshesToPreserveNames.push(reticle.name);

    if ("xr" in window.navigator) {
        xrExperience = await scene.createDefaultXRExperienceAsync(XR_OPTIONS);
        interactionManager = new InteractionManager(scene, xrExperience); // @todo; Move outside this conditional
        await configureXR(xrExperience);

        // Collect names of meshes that should be instantiated only once, even across
        // scene resets. These are things like the XR teleportation marker, XR hand
        // meshes, and XR controller pointers and grips.
        meshesToPreserveNames.push(...scene.meshes.map(mesh => mesh.name));
        for (const controller of xrExperience.input.controllers) {
            meshesToPreserveNames.push(controller.pointer.name);
            if (controller.grip) {
                meshesToPreserveNames.push(controller.grip.name);
            }
        }
        xrExperience.input.onControllerAddedObservable.add(controller => {
            meshesToPreserveNames.push(controller.pointer.name);
            if (controller.grip) {
                meshesToPreserveNames.push(controller.grip.name);
            }
        });
        xrExperience.input.onControllerRemovedObservable.add(controller => {
            let index = meshesToPreserveNames.findIndex(name => name === controller.pointer.name);
            if (index !== -1) {
                meshesToPreserveNames.splice(index, 1);
            }
            if (controller.grip) {
                index = meshesToPreserveNames.findIndex(name => name === controller.grip.name);
                if (index !== -1) {
                    meshesToPreserveNames.splice(index, 1);
                }
            }
        });

        // XR laser pointers
        meshesToPreserveNames.push("laserPointer");

    }
    
    await loadSounds("./json/sounds.json");
    await initScene(scene);

    const splashScreen = document.querySelector("div.splash") as HTMLElement;
    let response= await fetch("./images/Notebook.svg")
    let svg= await response.text();

    // splashScreen.style.opacity="0";
    splashScreen.innerHTML = svg;
    // setTimeout(()=> splashScreen.style.opacity="1",1000)
    splashScreen.addEventListener("click", () => {
        splashScreen.classList.add("hide");
        interactionManager.onModeChangeObservable.notifyObservers(interactionManager.mode);
        Engine.audioEngine.audioContext.resume();
        const vrIcon = document.getElementsByClassName("babylonVRicon")[0];
        if (vrIcon) {
            vrIcon.classList.remove("hide");
        }

    }, false);

    if (import.meta.env.DEV){
        splashScreen.dispatchEvent(new Event("click"));
    }
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

export async function initScene(scene: Scene): Promise<Scene> {
    const vrIcon = document.getElementsByClassName("babylonVRicon")[0];
    if (vrIcon) {
        vrIcon.classList.add("hide");
    }

    meshMap["FireCabinet"] = "FireCabinet"
    meshMap["Glass Divider"] = "Glass Divider"
    meshMap["room"] = "rg"
    meshMap["clipboard"] = "clipboardc"
    meshMap["fire-extinguisher"] = "fire-extinguisherc"
    
    const light = scene.getLightByName("light1");
    light.intensity = 0;
    const camera = scene.activeCamera;
    const meshesToDispose = scene.meshes.filter(mesh => !meshesToPreserveNames.includes(mesh.name))
        .concat(utilityLayer.utilityLayerScene.meshes.filter(mesh => !meshesToPreserveNames.includes(mesh.name)));
    for (const mesh of meshesToDispose) {
        mesh.dispose();
    }
    
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

    // FadeRespawnBehavior.allAttachedObservable.add(allAttached => {
    //     if (allAttached) {
    //         setRespawnPoints(scene);
    //     }
    // })

    // Set respawn points after placing meshes.

    // Places the camera at the starting position.
    placeCamera(camera);

    meshesLoaded.notifyObservers(true);

    if (!stateMachineFirstTime) {
        if (stateMachine) {
            console.log("setup game states new");
            setupGameStates(stateMachine.platform);
        }
    }

    stateMachineFirstTime = false;
    
    if ("xr" in window.navigator) {
        xrExperience.teleportation.removeFloorMeshByName("Floor");
        xrExperience.teleportation.addFloorMesh(scene.getMeshByName("Floor"));
    }

    let isTouchDevice = false;

    if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.maxTouchPoints > 0)) {
      isTouchDevice = true;
    }    

    if (isTouchDevice) {
	    activateButton = GUIButtons(false);
    }    


    document.exitPointerLock();

    const canvas = document.getElementById("canvas");
    const handleInitialClick: EventListener = (e: Event) => {
        stateMachine.onStateChangeObervable.notifyObservers(GameStates.BASE);
        canvas.removeEventListener('click', handleInitialClick);
    };
    canvas.addEventListener("click", handleInitialClick);

    fadeIn(light);

    finalGameState.notifyObservers(Status.RESET);

    return scene;
}

function configureScene(scene: Scene, debug: boolean): void {
    scene.collisionsEnabled = true;

    if (debug && import.meta.env.DEV) {
        import("@babylonjs/inspector").then(({ Inspector }) => {
            Inspector.Hide();
            window.addEventListener("keydown", (ev) => {
                // Shift+Ctrl+Alt+I
                if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                    if (Inspector.IsVisible) {
                        Inspector.Hide();
                    } else {
                        Inspector.Show(scene, {});
                    }
                }
            });
        });
    }
}

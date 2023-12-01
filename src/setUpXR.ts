import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRInputSource } from "@babylonjs/core/XR/webXRInputSource";
import { WebXRState } from "@babylonjs/core/XR/webXRTypes";

import { loadXRHands } from "./loadXRHands";
import { log } from "./utils";

export async function setUpXR(xrExperience: WebXRDefaultExperience): Promise<void> {
    log("setUpXR start");
    // let displayPointer = false;
    let displayPointer = true;

    xrExperience.pointerSelection.laserPointerDefaultColor = Color3.Green();
    xrExperience.pointerSelection.laserPointerPickedColor = Color3.Green();
    xrExperience.pointerSelection.selectionMeshDefaultColor = Color3.Green();
    xrExperience.pointerSelection.selectionMeshPickedColor = Color3.Green();

    xrExperience.pointerSelection.displayLaserPointer = displayPointer;
    xrExperience.pointerSelection.displaySelectionMesh = displayPointer;

    window.addEventListener("keydown", e => {
        // Shift + Ctrl + Alt + I
        if (e.keyCode === 73) {
            // @todo: Migrate use of e.keyCode to e.key.
            displayPointer = !displayPointer;
            xrExperience.pointerSelection.displayLaserPointer = displayPointer;
            xrExperience.pointerSelection.displaySelectionMesh = displayPointer;
        }
    });

    const [leftHand, rightHand] = await loadXRHands("left", "right");

    // @todo: Is this necessary? And if it is, is it necessary to be done here? It doesn't really belong.
    // pauseAnimations(scene);
    xrExperience.baseExperience.onStateChangedObservable.add(state => {
        if (state === WebXRState.IN_XR) {
            // @todo: Do we really need to do this? I understand we might need to for audio to work properly.
            // But maybe it can go somewhere else.
            // displayXRSplashScreen(xrExperience, scene);
        }
    });

    xrExperience.baseExperience.camera.onAfterCameraTeleport.add(() => {
        // It's pretty weird to me that this is required. Is there a general solution to this? This is fine;
        // it would just be nice to know why it's necessary.
        xrExperience.baseExperience.camera.position.y = xrExperience.baseExperience.camera.realWorldHeight;
    });
    
    xrExperience.input.controllers.forEach(controller => {
        const squeezeComponent = controller.motionController.getComponentOfType("squeeze");
        console.log("Squeeze component:");
        console.log(squeezeComponent);
    });
    xrExperience.input.onControllerAddedObservable.add(controller => {
        setUpInputSource(controller);
    });


    log("setUpXR end");
}

function displayXRSplashScreen(xrExperience: WebXRDefaultExperience, scene: Scene) {
    // @todo: Does this display the splash screen or simply position it?
    const screen = scene.getMeshByName("Start");
    if (screen) {
        const camera = xrExperience.baseExperience.camera;
        screen.parent = camera;
        screen.position.copyFrom(camera.position).addInPlaceFromFloats(-camera.position.x, -1.5, 1.15);
        
        xrExperience.pointerSelection.displayLaserPointer = true;
        xrExperience.pointerSelection.displaySelectionMesh = true;

        // This appears to overwrite the positioning performed above. Unclear why. Maybe the previous was supposed
        // to be removed?
        // screen.position.x = 0;
        // screen.position.y = 0;
        // screen.position.z = 0.7;

        screen.rotationQuaternion = null;  // I added this. Might not be necessary, but Babylon recommends doing it anyway when you're using rotation: rotation and rotationQuaternion don't mix well.
        screen.rotation = Vector3.Zero();
    }
}

function setUpInputSource(inputSource: WebXRInputSource): void {
    inputSource.onMotionControllerInitObservable.add(motionController => {
        const squeezeComponent = motionController.getComponentOfType("squeeze");
        squeezeComponent.onButtonStateChangedObservable.add(component => {
            // @todo: Do fist animation
        });
    });
}

function setUpHandMesh(handMesh: Mesh, color: Color3): void {
    const handMaterial = new StandardMaterial("hand-material");
    handMaterial.diffuseColor.copyFrom(color);
    handMesh.material = handMaterial;
    handMesh.isPickable = false;
}

function addHandMesh(inputSource: WebXRInputSource, handMesh: Mesh): void {
    // @todo: Add the hand mesh to the player's controller.
}

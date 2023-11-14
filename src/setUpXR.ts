import { WebXRDefaultExperience, WebXRDefaultExperienceOptions } from "@babylonjs/core/XR/webXRDefaultExperience";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { loadXRHands } from "./loadXRHands";
import { pauseAnimations } from "./scene";
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh, Observable, Observer, Ray, StandardMaterial, WebXRAbstractMotionController, WebXRControllerPointerSelection, WebXRFeatureName, WebXRInput, WebXRInputSource, WebXRState } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { log } from "./utils";
import { InteractableXRBehavior } from "./InteractableXRBehavior";
import { InteractionXRManager } from "./InteractionXRManager";

// Create the default XR experience
// fireExtinguisher.xrCamera = xrExperience
// Set XR options
// place XR camera
// displayPtr = false
// xrExperience pointer selection options
// keydown event listener to enable/disable pointer selection
// Instantiate XR object
// await xrObject.addWebXr()
// Add FlyToCameraBehavior to the clipboard with the camera as the target
// Add XR GUI
// Add addHandModels function to the XR object
// Set up post scene cylinders? What's that?
// Add WebXRBehaviors
// Add the the addWebXRBehaviors hook to the Cylinder objects

// Create the default XR experience
// - scene.ts
// fireExtinguisher.xrCamera = xrExperience
// - Get rid of fireExtinguisher. Do something else - maybe this could belong in Interactable
// Set XR options
// - setUpXR
// place XR camera
// - placeCamera, probably. Put all camera code in the same-ish place
// displayPtr = false
// - setUpXR
// xrExperience pointer selection options
// - setUpXR
// keydown event listener to enable/disable pointer selection
// setUpXR? Maybe a debug options function?
// Instantiate XR object
// - I don't like this. There is already an XR object; we should use only that. A custom class just seems like a temptation to tightly couple code. Also, it does nothing useful at all; it's just an interface to group up two functions without needing to list the arguments. That's not a good enough reason, and the functions need a lot of work in any case.
// await xrObject.addWebXr()
// - This is a mess that seems to do too much, and the name isn't at all descriptive. This should be something like five different functions.
// Add FlyToCameraBehavior to the clipboard with the camera as the target
// - Probably belongs in a setUpClipboard, but ideally the clipboard won't need to be special and could be an Interactable
// Add XR GUI
// - A display GUI function or something.
// Add addHandModels function to the XR object
// - This is way more complicated than it needs to be. The callback is returned, then passed as an attribute to a bunch of different instances. Worse, it's labeled as any. Figure something else out, after you figure out what this does.
// Set up post scene cylinders? What's that?
// - This is too confusing. Figure out what it does and make it make sense without needing to analyze the whole thing.
// Add WebXRBehaviors
// - This doesn't do what it says it does. We should not be getting a toggleControllers() callback from this method. Something like this should return void.
// Add the the addWebXRBehaviors hook to the Cylinder objects
// - I don't like wrapper classes.

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

    const interactionManager = new InteractionXRManager(xrExperience);
    
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

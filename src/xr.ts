import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { WebXRDefaultExperience, WebXRDefaultExperienceOptions } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRInputSource } from "@babylonjs/core/XR/webXRInputSource";
import { WebXRState } from "@babylonjs/core/XR/webXRTypes";
import { WebXRAbstractMotionController } from "@babylonjs/core/XR/motionController/webXRAbstractMotionController";

import { loadXRHands } from "./loadXRHands";
import { interactionManager, meshesToPreserveNames } from "./scene";
import { InteractionMode } from "./interactionManager";

export const XR_OPTIONS: WebXRDefaultExperienceOptions = {
    inputOptions: {
        doNotLoadControllerMeshes: true
    },
    pointerSelectionOptions: {
        enablePointerSelectionOnAllControllers: true
    },
    uiOptions: {
        onError: (e) => console.error(e)
    }
};

export async function configureXR(xrExperience: WebXRDefaultExperience): Promise<void> {
    let displayPointer = false;

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
    
    const leftHandName = "left";
    const rightHandName = "right";
    const hands = await loadXRHands(leftHandName, rightHandName);

    for (const controller of xrExperience.input.controllers) {
        configureController(controller, hands[`${controller.inputSource.handedness}`]);
    }
    xrExperience.input.onControllerAddedObservable.add(controller => {
        configureController(controller, hands[`${controller.inputSource.handedness}`]);
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

function configureController(controller: WebXRInputSource, handMesh: AbstractMesh): void {
    meshesToPreserveNames.push(controller.pointer.name);
    if (controller.grip) {
        meshesToPreserveNames.push(controller.grip.name);
    }
    handMesh.isPickable = false;
    addHandMesh(controller, handMesh, controller.inputSource.handedness);
}

function addHandMesh(controller: WebXRInputSource, handMesh: AbstractMesh, handedness: XRHandedness): void {
    handMesh.setParent(controller.pointer);
    handMesh.rotationQuaternion = null;
    if (handedness !== "none") {
        handMesh.rotation.copyFromFloats(Math.PI, 0, Math.PI / 2);
    } else {
        handMesh.rotation.copyFromFloats(0, 0, 0);
    }
    if (controller.motionController) {
        addHandAnimations(controller.motionController, handMesh);
    }
    controller.onMotionControllerInitObservable.add(motionController => {
        addHandAnimations(motionController, handMesh);
    });
    interactionManager.addSelector(controller.pointer, handMesh, [InteractionMode.XR]);
    meshesToPreserveNames.push(handMesh.name);
}

function addHandAnimations(motionController: WebXRAbstractMotionController, handMesh: AbstractMesh) {
    const squeezeComponent = motionController.getComponentOfType("squeeze");
    const squeezeAnimation = handMesh.getScene().animationGroups.find(animGroup => animGroup.name === `Fist-${handMesh.name}`);
    squeezeComponent.onButtonStateChangedObservable.add(component => {
        const targetFrame = squeezeAnimation.from + (squeezeAnimation.to - squeezeAnimation.from) * component.value;
        squeezeAnimation.goToFrame(targetFrame);
    });
}

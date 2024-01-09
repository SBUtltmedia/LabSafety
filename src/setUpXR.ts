import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRInputSource } from "@babylonjs/core/XR/webXRInputSource";
import { WebXRState } from "@babylonjs/core/XR/webXRTypes";
import { WebXRAbstractMotionController } from "@babylonjs/core/XR/motionController/webXRAbstractMotionController";

import { loadXRHands } from "./loadXRHands";
import { interactionXRManager } from "./scene";
import { log } from "./utils";

export async function setUpXR(xrExperience: WebXRDefaultExperience): Promise<void> {
    log("setUpXR start");
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

    const leftHandName = "left";
    const rightHandName = "right";
    const [leftHand, rightHand] = await loadXRHands(leftHandName, rightHandName);

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
    
    for (const controller of xrExperience.input.controllers) {
        setUpController(controller, leftHand, rightHand);
    }
    xrExperience.input.onControllerAddedObservable.add(controller => {
        setUpController(controller, leftHand, rightHand);
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

function setUpController(controller: WebXRInputSource, leftHand: Mesh, rightHand: Mesh): void {
    let handMesh: Nullable<Mesh> = null;
        if (controller.inputSource.handedness === "left") {
            handMesh = leftHand;
        } else if (controller.inputSource.handedness === "right") {
            handMesh = rightHand;
        } else {
            return;
        }

        setUpHandMesh(handMesh, new Color3(0 / 255, 128 / 255, 255 / 255));
        addHandMesh(controller, handMesh, controller.inputSource.handedness);
}

function setUpHandMesh(handMesh: Mesh, color: Color3): void {
    handMesh.isPickable = false;
    
    const handMaterial = new StandardMaterial("hand-material");
    handMaterial.diffuseColor.copyFrom(color);
    handMesh.material = handMaterial;
}

function addHandMesh(controller: WebXRInputSource, handMesh: Mesh, handedness: XRHandedness): void {
    handMesh.setParent(controller.grip || controller.pointer);
    handMesh.rotationQuaternion = null;
    if (handedness === "left") {
        handMesh.rotation.copyFromFloats(5 * Math.PI / 4, 0, Math.PI / 2);
    } else if (handedness === "right") {
        handMesh.rotation.copyFromFloats(-Math.PI / 4, Math.PI, 3 * Math.PI / 2);
    } else {
        handMesh.rotation.copyFromFloats(0, 0, 0);
    }
    if (controller.motionController) {
        addHandAnimations(controller.motionController, handMesh);
    }
    controller.onMotionControllerInitObservable.add(motionController => {
        addHandAnimations(motionController, handMesh);
    });
    interactionXRManager.handMeshMap[controller.uniqueId] = handMesh;
}

function addHandAnimations(motionController: WebXRAbstractMotionController, handMesh: Mesh) {
    const squeezeComponent = motionController.getComponentOfType("squeeze");
    const squeezeAnimation = handMesh.getScene().animationGroups.find(animGroup => animGroup.name === `Fist-${handMesh.name}`);
    squeezeComponent.onButtonStateChangedObservable.add(component => {
        const targetFrame = squeezeAnimation.from + (squeezeAnimation.to - squeezeAnimation.from) * component.value;
        squeezeAnimation.goToFrame(targetFrame);
    });
}

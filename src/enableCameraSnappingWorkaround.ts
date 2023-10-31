import { Camera } from "@babylonjs/core/Cameras/camera";
import { MAX_DISPLACEMENT_PER_FRAME } from "./Constants";

export function enableCameraSnappingWorkaround(camera: Camera) {
    // @todo: will this mess up XR teleportation and movement?
    const scene = camera.getScene();
    let cameraPosition = camera.position.clone();

    scene.onBeforeRenderObservable.add(() => {
        const displacementVector = camera.position.subtract(cameraPosition);
        const displacementLength = displacementVector.length();
        if (displacementLength > MAX_DISPLACEMENT_PER_FRAME) {
            // Reduce the length of the jump from displacementLength to 0.01 to get the player "unstuck"
            camera.position = cameraPosition.addInPlace(displacementVector.scale(0.01/displacementLength));
        }
        cameraPosition.copyFrom(camera.position);
    });
}

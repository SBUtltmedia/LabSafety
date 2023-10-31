import { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function placeCamera(camera: Camera): void {
    // @todo: handle rotation where applicable, or put that in an orientCamera() or something
    const scene = camera.getScene();
    const table = scene.meshes.find(mesh => mesh.name === "Table");
    if (table) {
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        // @todo: this is incorrect with the latest room model, but I'm keeping it for consistency
        camera.position.x = tableBoundingBox.center.x - 0.5;
        camera.position.y = tableBoundingBox.center.y * 2 + 1.75;
        camera.position.z = -1.5;
    } else {
        // Default
        camera.position = Vector3.Zero();
    }
}

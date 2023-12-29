import { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function placeCamera(camera: Camera): void {
    const scene = camera.getScene();
    const table = scene.meshes.find(mesh => mesh.name === "Table");
    if (table) {
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        camera.position.x = tableBoundingBox.center.x - 0.5;
        camera.position.y = tableBoundingBox.center.y * 2 + 0.46;
        camera.position.z = -3;
    } else {
        // Default
        camera.position = Vector3.Zero();
    }
}

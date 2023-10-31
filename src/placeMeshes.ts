import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export function placeMeshes(meshes: Mesh[]): void {
    const cylinders = meshes.filter(mesh => mesh.name.split("-")[0] === "cylinder");
    const placards = meshes.filter(mesh => mesh.name.split("-")[0] === "placard" && !mesh.name.includes("placard-base"));
    const table = meshes.find(mesh => mesh.name === "Table");
    if (table) {
        // @todo: Is this guaranteed? Maybe we can do without the if statement.
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        cylinders.forEach((cylinder, i) => {
            const cylinderIdentifier = cylinder.name.split("-")[1];
            const cylinderBase = cylinder.getChildMeshes().find(childMesh => childMesh.name === `base-${cylinderIdentifier}`);  // @todo: is it cylinder-base or cylinder-x.cylinder-base when cloned?
            const cylinderBaseBoundingBox = cylinderBase.getBoundingInfo().boundingBox;
            const cylinderVerticalOffset = cylinder.position.y - cylinderBaseBoundingBox.minimum.y;
            cylinder.position.y = tableBoundingBox.maximum.y + cylinderVerticalOffset;  // @todo: maximumWorld: does maximum work? Also, do I need to add 0.0075 like was there before to prevent z-fighting?
            cylinder.position.x = tableBoundingBox.minimum.x + (i + 1) * (tableBoundingBox.maximum.x - tableBoundingBox.minimum.x) / (cylinders.length + 2);
            cylinder.position.z = tableBoundingBox.center.z;
        });

        placards.forEach((placard, i) => {
            // const placardIdentifier = placard.name.split("-")[1];
            const placardBase = placard.getChildMeshes().find(childMesh => childMesh.name === "placard-base");
            const placardBaseBoundingBox = placardBase.getBoundingInfo().boundingBox;
            const placardVerticalOffset = placard.position.y - placardBaseBoundingBox.minimum.y;
            placard.position.y = tableBoundingBox.maximum.y + placardVerticalOffset;
            placard.position.x = tableBoundingBox.minimum.x + (i + 1) * (tableBoundingBox.maximum.x - tableBoundingBox.minimum.x) / (placards.length + 2) + 0.2
            placard.position.z = tableBoundingBox.center.z + 0.2;

            placard.rotationQuaternion = null;
            placard.rotation = new Vector3(0, Math.PI / 2, 0);
        });
    }
}

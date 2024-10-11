import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { meshMap } from "./loadMeshes";

function compareById(left: AbstractMesh, right: AbstractMesh): number {
    if (left.id < right.id) {
        return -1;
    } else if (left.id > right.id) {
        return 1;
    } else {
        return 0;
    }
}

export function placeMeshes(meshes: Mesh[]): void {
    const cylinders = meshes.filter(mesh => {
        return mesh.id.split("-").length === 2 && mesh.id.split("-")[0] === meshMap["cylinder"];
    }).sort(compareById);
    const placards = meshes.filter(mesh => {
        return mesh.name.split("-")[0] === meshMap["placard"] && !mesh.name.includes("placard-base")
    }).sort(compareById);

    console.log(meshes.map(mesh => mesh.name));
    
    const clipboard = meshes.find(mesh => mesh.id === meshMap["clipboard"]);
    const table = meshes.find(mesh => mesh.name === "Table");
    const fireExtinguisher = meshes.find(mesh => mesh.id === meshMap["fire-extinguisher"]);
    if (table) {
        // @todo: Is this guaranteed? Maybe we can do without the if statement.
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        cylinders.forEach((cylinder, i) => {
            const cylinderBoundingBox = cylinder.getBoundingInfo().boundingBox;
            const cylinderVerticalOffset = cylinder.position.y - cylinderBoundingBox.minimum.y;
            cylinder.position.copyFromFloats(
                tableBoundingBox.minimum.x + (i + 1) * (tableBoundingBox.maximum.x - tableBoundingBox.minimum.x) / (cylinders.length + 2),
                tableBoundingBox.maximum.y + cylinderVerticalOffset,
                (2 * tableBoundingBox.minimum.z + tableBoundingBox.center.z) / 3
            );
            
            cylinder.rotationQuaternion = null;
            cylinder.rotation.copyFromFloats(Math.PI, 0, 0);
        });

        placards.forEach((placard, i) => {
            const placardBase = placard.getChildMeshes().find(childMesh => childMesh.name === "placard-base");
            const placardBaseBoundingBox = placardBase.getBoundingInfo().boundingBox;
            const placardVerticalOffset = placard.position.y - placardBaseBoundingBox.minimum.y;
            placard.position.y = tableBoundingBox.maximum.y + placardVerticalOffset;
            placard.position.x = tableBoundingBox.minimum.x + (i + 1) * (tableBoundingBox.maximum.x - tableBoundingBox.minimum.x) / (placards.length + 2) + 0.2
            placard.position.z = (2 * tableBoundingBox.minimum.z + tableBoundingBox.center.z) / 3 + 0.2;

            placard.rotationQuaternion = null;
            placard.rotation.copyFromFloats(0, Math.PI / 2, 0);
        });
        
        clipboard.position.copyFromFloats(
            cylinders[0].position.x + 0.5,
            tableBoundingBox.maximum.y,
            cylinders[0].position.z + 0.3
        );

        clipboard.rotationQuaternion = null;
        clipboard.rotation.copyFromFloats(
            0,
            -Math.PI / 2,
            Math.PI
        );

        // @todo: Hard-coded, bad!
        fireExtinguisher.position.copyFromFloats(3.73, 1.77, -2.51);
        fireExtinguisher.rotationQuaternion = null;
        fireExtinguisher.rotation.copyFromFloats(0, 0, Math.PI);
    }
}

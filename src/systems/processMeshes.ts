import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { createClipboard } from "../entities/createClipboard";
import { createCylinder } from "../entities/createCylinder";
import { createPlacard } from "../entities/createPlacard";
import { createRoom } from "../entities/createRoom";
import { createFireExtinguisher } from "../entities/createFireExtinguisher";
import { createGlassDivider } from "../entities/createGlassDivider";
import { meshMap } from "../entities/loadMeshes";

export function processMeshes(meshes: Mesh[]) {
    // @todo: make constants out of the names.
    // @todo: What if all meshes don't load?
    const roomMesh = meshes.find(mesh => mesh.name === meshMap["rgBB"])!;
    const placardMesh = meshes.find(mesh => mesh.name === meshMap["placard"])!;
    const cylinderMesh = meshes.find(mesh => mesh.name === meshMap["cylinder"])!.getChildMeshes(true)[0] as Mesh;
    // @todo: Process the clipboard and fire extinguisher meshes.
    const clipboardMesh = meshes.find(mesh => mesh.name === meshMap["clipboard"])!.getChildMeshes(true)[0] as AbstractMesh;
    const fireExtinguisherMesh = meshes.find(mesh => mesh.name === meshMap["fire-extinguisher"])!.getChildMeshes(true)[0] as Mesh;

    const glassDivider = meshes.find(mesh => mesh.name === meshMap["Glass Divider"]);

    createRoom(roomMesh);
//    roomMesh.setEnabled(false);
    createGlassDivider(glassDivider);

    const clipboardRoot = clipboardMesh.parent;
    clipboardMesh.setParent(null);
    clipboardRoot.dispose(true);


    renameClipboard(clipboardMesh);

    createClipboard(clipboardMesh);

    meshMap["clipboard"] = clipboardMesh.name;

    const placardC = placardMesh.clone(`${placardMesh.name}-c`, placardMesh.parent);
    const placardB = placardMesh.clone(`${placardMesh.name}-b`, placardMesh.parent);
    const placardA = placardMesh;

    placardC.id = placardC.name;
    placardB.id = placardB.name;
    placardA.name += "-a";
    placardA.id = placardA.name;

    placardC.getChildMeshes().forEach(childMesh => childMesh.name = childMesh.name.split(".")[1]);
    placardB.getChildMeshes().forEach(childMesh => childMesh.name = childMesh.name.split(".")[1]);

    createPlacard(placardC);
    createPlacard(placardB);
    createPlacard(placardA);

    meshes.push(placardC, placardB);

    const cylinderRoot = cylinderMesh.parent;
    cylinderMesh.setParent(null);
    cylinderRoot.dispose(true);
    
    const cylinderC = cylinderMesh.clone(`${cylinderMesh.id}-c`, null) as Mesh;
    const cylinderB = cylinderMesh.clone(`${cylinderMesh.id}-b`, null) as Mesh;
    const cylinderA = cylinderMesh;

    renameCylinders([cylinderA, cylinderB, cylinderC], ["a", "b", "c"]);

    createCylinder(cylinderC, Color3.Blue());
    createCylinder(cylinderB, Color3.Green());
    createCylinder(cylinderA, Color3.Red());

    const fireExtinguisherRoot = fireExtinguisherMesh.parent;
    // Because fireExtinguisherMesh is about to be renamed to "fire-extinguisher"
    fireExtinguisherMesh.setParent(null);
    fireExtinguisherRoot.dispose();

    fireExtinguisherMesh.id = "fire-extinguisher";
    fireExtinguisherMesh.name = fireExtinguisherMesh.id;

    meshMap["fire-extinguisher"] = fireExtinguisherMesh.name;
    
    createFireExtinguisher(fireExtinguisherMesh);

    meshes.push(cylinderC, cylinderB);
}

function renameCylinders(cylinders: Mesh[], identifiers: string[]): void {
    cylinders.forEach((cylinder, i) => {
        cylinder.id = `cylinder-${identifiers[i]}`;
        cylinder.name = cylinder.id;
        cylinder.getChildMeshes().forEach(childMesh => {
            switch (childMesh.id.split(".").pop()) {
                case "BeakerLiquid":
                    childMesh.id = `${cylinder.id}-liquid`;
                    childMesh.name = childMesh.id;
                    break;
                case "Label":
                    childMesh.id = `${cylinder.id}-label`;
                    break;
                case "LabelBack":
                    childMesh.id = `${cylinder.id}-labelback`;
                    break;
            }
        });
    });
}

function renameClipboard(clipboard: AbstractMesh): void {
    clipboard.id = "clipboard";
    clipboard.name = clipboard.id;
    clipboard.getChildMeshes().forEach(childMesh => {
        switch (childMesh.id) {
            case "Plane":
                childMesh.id = `${clipboard.id}-plane`;
                childMesh.name = childMesh.id;
                break;
            case "Clipper":
                childMesh.id = `${clipboard.id}-clip`;
                childMesh.name = childMesh.id;
                break;
            case "horizontalScrew":
                childMesh.id = `${clipboard.id}-screw`;
                childMesh.name = childMesh.id;
                break;
            case "metalThingy":
                childMesh.id = `${clipboard.id}-metal`;
                childMesh.name = childMesh.id;
                break;
        }
    });
}
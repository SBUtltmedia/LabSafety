import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createCylinder } from "./createCylinder";
import { createPlacard } from "./createPlacard";
import { createRoom } from "./createRoom";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh } from "@babylonjs/core";

export function processMeshes(meshes: Mesh[]) {
    // Need to run all the callbacks in the models argument in createSceneOne() in the SceneManager
    // @todo: make constants out of the names.
    // @todo: What if all meshes don't load?
    const roomMesh = meshes.find(mesh => mesh.name === "room")!;
    const placardMesh = meshes.find(mesh => mesh.name === "placard")!;
    const cylinderMesh = meshes.find(mesh => mesh.name === "cylinder")!.getChildMeshes(true)[0] as Mesh;
    // @todo: Process the clipboard and fire extinguisher meshes.
    const clipboardMesh = meshes.find(mesh => mesh.name === "clipboard");
    const fireExtinguisherMesh = meshes.find(mesh => mesh.name === "fire-extinguisher");

    createRoom(roomMesh);

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

    cylinderMesh.setParent(null);
    
    const cylinderC = cylinderMesh.clone(`${cylinderMesh.name}-c`, null) as Mesh;
    const cylinderB = cylinderMesh.clone(`${cylinderMesh.name}-b`, null) as Mesh;
    const cylinderA = cylinderMesh;

    renameCylinders([cylinderA, cylinderB, cylinderC], ["a", "b", "c"]);

    createCylinder(cylinderC, Color3.Blue(), [cylinderA, cylinderB]);
    createCylinder(cylinderB, Color3.Green(), [cylinderA, cylinderC]);
    createCylinder(cylinderA, Color3.Red(), [cylinderB, cylinderC]);

    meshes.push(cylinderC, cylinderB);
}

function getCylinderBaseMesh(rootMesh: AbstractMesh): Mesh {
    const meshIdentifier = rootMesh.name.split("-")[1];
    const baseMesh = rootMesh.getChildMeshes().find(childMesh => childMesh.name === `base-${meshIdentifier}`) as Mesh;
    return baseMesh;
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

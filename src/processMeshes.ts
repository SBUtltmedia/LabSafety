import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createCylinder } from "./createCylinder";
import { createPlacard } from "./createPlacard";
import { createRoom } from "./createRoom";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export function processMeshes(meshes: Mesh[]) {
    // Need to run all the callbacks in the models argument in createSceneOne() in the SceneManager
    // @todo: make constants out of the names.
    // @todo: What if all meshes don't load?
    const roomMesh = meshes.find(mesh => mesh.name === "room")!;
    const placardMesh = meshes.find(mesh => mesh.name === "placard")!;
    const cylinderMesh = meshes.find(mesh => mesh.name === "cylinder")!;
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
    
    // @todo: process fire extinguisher, finish processing cylinders (with wrapper class)...
    const cylinderC = cylinderMesh.clone(`${cylinderMesh.name}-c`, cylinderMesh.parent);
    const cylinderB = cylinderMesh.clone(`${cylinderMesh.name}-b`, cylinderMesh.parent);
    const cylinderA = cylinderMesh;

    cylinderC.id = cylinderC.name;
    cylinderB.id = cylinderB.name;
    cylinderA.name += "-a";
    cylinderA.id = cylinderA.name;

    createCylinder(cylinderC, Color3.Blue());
    createCylinder(cylinderB, Color3.Green());
    createCylinder(cylinderA, Color3.Red());

    meshes.push(cylinderC, cylinderB);
}
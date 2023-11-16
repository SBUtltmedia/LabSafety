import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CYLINDER_LIQUID_MESH_NAME } from "./Constants";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { interactionXRManager } from "./scene";
import { AbstractMesh, Nullable, Vector3 } from "@babylonjs/core";
import { log } from "./utils";

import { PouringBehavior } from "./PouringBehavior";
import { PourableBehavior } from "./PourableBehavior";

export function createCylinder(mesh: Mesh, color: Color3, targets: Mesh[]): void {
    const meshIdentifier = mesh.name.split("-")[1];  // "a", "b", "c", etc.

    const liquidMesh = mesh.getChildMeshes().find(childMesh => childMesh.name === `${CYLINDER_LIQUID_MESH_NAME}-${meshIdentifier}`);
    const liquidMaterial = new StandardMaterial("liquid-material");
    liquidMaterial.diffuseColor = color;
    liquidMesh.material = liquidMaterial;

    const texture = new DynamicTexture("dynamic-texture", 256, null, true, Texture.LINEAR_LINEAR_MIPNEAREST);
    texture.uAng = Math.PI;
    const material = new StandardMaterial("cylinder-label-material");
    material.diffuseTexture = texture;

    const font = "bold 250px monospace";
    mesh.getChildMeshes().filter(childMesh => childMesh.name.includes("Label")).forEach(m => m.material = material);
    texture.drawText(mesh.name.split("-").pop().toUpperCase(), 0, 225, font, "black", "white");

    const baseMesh = mesh.getChildMeshes().find(childMesh => childMesh.name === `base-${meshIdentifier}`) as Mesh;

    const pouringBehavior = new PouringBehavior(targets, interactionXRManager);
    const pourableBehavior = new PourableBehavior();

    baseMesh.addBehavior(pouringBehavior);
    baseMesh.addBehavior(pourableBehavior);
}

export function renameCylinder(rootMesh: AbstractMesh): void {
    rootMesh.id = rootMesh.name;
    const meshIdentifier = rootMesh.name.split("-")[1];  // "a", "b", "c", etc.
    // @todo: This shouldn't be necessary. These ought to be correct in the files themselves. Well, adding the suffixes might be necessary here.
    rootMesh.getChildMeshes().forEach(childMesh => {
        if (childMesh.name.split(".").pop() === "BeakerwOpacity") {
            childMesh.name = `base-${meshIdentifier}`;
            childMesh.id = `base-${meshIdentifier}`;
            // childMesh.isPickable = false;  // @todo: Is this correct?
        } else if (childMesh.name.split(".").pop() === "BeakerLiquid") {
            childMesh.name = `${CYLINDER_LIQUID_MESH_NAME}-${meshIdentifier}`;
            childMesh.id = `${CYLINDER_LIQUID_MESH_NAME}-${meshIdentifier}`;
            childMesh.isPickable = false;  // @todo: Is this correct?
        }
    });
}

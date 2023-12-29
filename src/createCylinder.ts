import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import { PourableBehavior } from "./PourableBehavior";
import { PouringBehavior } from "./PouringBehavior";
import { interactionXRManager } from "./scene";
import { FadeRespawnBehavior } from "./FadeRespawnBehavior";

export function createCylinder(mesh: Mesh, color: Color3, targets: Mesh[]): void {
    const liquidMesh = mesh.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid");
    const liquidMaterial = new StandardMaterial("liquid-material");
    liquidMaterial.diffuseColor = color;
    liquidMesh.material = liquidMaterial;

    const texture = new DynamicTexture("dynamic-texture", 256, null, true, Texture.LINEAR_LINEAR_MIPNEAREST);
    texture.uAng = Math.PI;
    const material = new StandardMaterial("cylinder-label-material");
    material.diffuseTexture = texture;

    const font = "bold 250px monospace";

    const label = mesh.getChildMeshes().find(childMesh => {
        return childMesh.id.split("-").pop() === "label";
    });
    label.material = material;
    texture.drawText(mesh.id.split("-").pop().toUpperCase(), 0, 225, font, "black", "white");

    // log("cylinder pos: ", mesh.position);

    const pouringBehavior = new PouringBehavior(targets, interactionXRManager);
    const pourableBehavior = new PourableBehavior();
    const fadeRespawnBehavior = new FadeRespawnBehavior();

    mesh.addBehavior(pouringBehavior);
    mesh.addBehavior(pourableBehavior);
    mesh.addBehavior(fadeRespawnBehavior);
    
}

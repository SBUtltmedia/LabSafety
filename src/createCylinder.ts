import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { FadeRespawnBehavior } from "./FadeRespawnBehavior";
import { InteractableBehavior } from "./interactableBehavior";
import { PouringBehavior } from "./PouringBehavior";
import { interactionManager } from "./scene";

export function setColor(mesh: AbstractMesh, color: Color3) {
    const liquidMesh = mesh.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid");
    const liquidMaterial = new StandardMaterial("liquid-material");
    liquidMaterial.diffuseColor = color;
    liquidMesh.material = liquidMaterial;
}

export function createCylinder(mesh: Mesh, color: Color3): void {
    setColor(mesh, color);

    const texture = new DynamicTexture("dynamic-texture", 256, null, true, Texture.LINEAR_LINEAR_MIPNEAREST);
    texture.uAng = Math.PI;
    const material = new StandardMaterial("cylinder-label-material");
    material.diffuseTexture = texture;

    const font = "bold 250px monospace";

    const labels = mesh.getChildMeshes().filter(childMesh => {
        const suffix = childMesh.id.split("-").pop();
        return suffix === "label" || suffix === "labelback";
    });
    for (const label of labels) {
        label.material = material;
        texture.drawText(mesh.id.split("-").pop().toUpperCase(), 0, 225, font, "black", "white");
    }

    const interactableBehavior = new InteractableBehavior(interactionManager, {
        activatable: true,
        defaultRotation: new Vector3(0, Math.PI / 2, Math.PI),
        moveAttached: false
        
    });    

    const pouringBehavior = new PouringBehavior();
    const fadeRespawnBehavior = new FadeRespawnBehavior();

    mesh.addBehavior(interactableBehavior);
    mesh.addBehavior(pouringBehavior);
    pouringBehavior.liquidMesh = mesh.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid");
    mesh.addBehavior(fadeRespawnBehavior);
}

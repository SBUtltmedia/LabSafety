import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { FadeRespawnBehavior } from "../behaviors/fadeRespawnBehavior";
import { InteractableBehavior } from "../behaviors/interactableBehavior";
import { PouringBehavior } from "../behaviors/pouringBehavior";
import { interactionManager } from "../scene";
import { InteractionMode } from "../managers/interactions/interactionManager";
import { CylinderSmokeBehavior } from "../behaviors/cylinderSmokeBehavior";

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

    let interactableBehavior;

    if (interactionManager.interactionMode === InteractionMode.XR) {
        interactableBehavior = new InteractableBehavior(interactionManager, {
            activatable: true,
            defaultAnchorRotation: new Vector3(0, Math.PI / 2, Math.PI),
            moveAttached: true
        });
    } else {
        interactableBehavior = new InteractableBehavior(interactionManager, {
            activatable: true,
            defaultAnchorRotation: new Vector3(0, Math.PI / 2, Math.PI),
            moveAttached: false
            
        });
    } 

    mesh.addBehavior(interactableBehavior);

    new Texture(
        "images/smokeParticleTexture.png",
    ).onLoadObservable.add(texture => {
        const cylinderSmokeBehavior = new CylinderSmokeBehavior(texture, mesh);
        mesh.addBehavior(cylinderSmokeBehavior);
        const pouringBehavior = new PouringBehavior();
        pouringBehavior.liquidMesh = mesh.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid");
        mesh.addBehavior(pouringBehavior);
        const fadeRespawnBehavior = new FadeRespawnBehavior();
        mesh.addBehavior(fadeRespawnBehavior);

        cylinderSmokeBehavior.stopSystem();
    
    })
    
}

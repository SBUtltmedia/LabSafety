import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { SOP_TEMPLATE_PATH } from "./Constants";
import { FadeRespawnBehavior } from "./FadeRespawnBehavior";
import { setupTasks } from "./GameTasks";
import { global } from "./GlobalState";
import { InteractableBehavior } from "./interactableBehavior";
import { InteractionMode } from "./interactionManager";
import { interactionManager } from "./scene";
import { ListItem, UpdateClipboardBehavior } from "./UpdateClipboardBehavior";

export function makeRespawnable(mesh: AbstractMesh): void {
    const fadeRespawnBehavior = new FadeRespawnBehavior();
    mesh.addBehavior(fadeRespawnBehavior);
}


export function createClipboard(mesh: AbstractMesh): void {
    const scene = mesh.getScene();

    const material = new StandardMaterial("clipboard-material", scene);
    material.emissiveColor.copyFrom(Color3.White());
    material.useAlphaFromDiffuseTexture = true;
        
    const plane = mesh.getChildMeshes().find(childMesh => childMesh.name === `${mesh.id}-plane`);
    plane.material = material;

    fetch(SOP_TEMPLATE_PATH)
    .then(r => r.text())
    .then(text => {
        fetch("./json/sopData.json")
        .then(r => r.json())
        .then(json => {
            let listItems: ListItem[] = json.items[1].sublist;

            setupTasks(scene, listItems, json.cylinders);

            const updateClipboardBehavior = new UpdateClipboardBehavior(text, json, global.sop, global.taskList);
            plane.addBehavior(updateClipboardBehavior);
        });
    });
    
    // @todo: Make the clipboard more readable out of XR
    const interactableBehavior = new InteractableBehavior(interactionManager, {
        defaultAnchorRotation: new Vector3(Math.PI, Math.PI / 2, Math.PI / 2),
        modeDefaults: {
            [InteractionMode.DESKTOP]: {
                defaultAnchorPosition: new Vector3(0, 0, -0.5)
            },
            [InteractionMode.MOBILE]: {
                defaultAnchorPosition: new Vector3(0, 0, -0.5)
            },
        }
    });

    if (plane instanceof Mesh) {
        interactableBehavior.interactionManager.highlightLayer.addExcludedMesh(plane);
    }    
    mesh.addBehavior(interactableBehavior);

    makeRespawnable(mesh);
}
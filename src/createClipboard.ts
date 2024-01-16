import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import { ListItem, UpdateClipboardBehavior } from "./UpdateClipboardBehavior";
import { setupTasks } from "./GameTasks";
import { global } from "./GlobalState";

export function createClipboard(mesh: AbstractMesh, templateString: string): void {
    const scene = mesh.getScene();

    const material = new StandardMaterial("clipboard-material", scene);
    material.emissiveColor.copyFrom(Color3.White());
    material.useAlphaFromDiffuseTexture = true;
        
    const plane = mesh.getChildMeshes().find(childMesh => childMesh.name === `${mesh.id}-plane`);
    plane.material = material;

    fetch("./src/sopData.json")
        .then(r => r.json())
        .then(json => {
            let listItems: ListItem[] = json.items[1].sublist;

            setupTasks(scene, listItems);

            const updateClipboardBehavior = new UpdateClipboardBehavior(templateString, json, global.sop, global.taskList);
            plane.addBehavior(updateClipboardBehavior);
        });
}

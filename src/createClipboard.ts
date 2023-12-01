import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import { bToCTask, cToATask, sop } from "./SOP";
import { UpdateClipboardBehavior } from "./UpdateClipboardBehavior";

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
            const updateClipboardBehavior = new UpdateClipboardBehavior(templateString, json, sop, [bToCTask, cToATask]);
            plane.addBehavior(updateClipboardBehavior);
        });
}

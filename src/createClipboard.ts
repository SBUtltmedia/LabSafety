import { AbstractMesh, Color3, StandardMaterial, Texture } from "@babylonjs/core";
import { UpdateClipboardBehavior } from "./UpdateClipboardBehavior";
import { bToCTask, cToATask, sop } from "./SOP";

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

import { AbstractMesh, Color3, StandardMaterial, Texture } from "@babylonjs/core";
import Handlebars from "handlebars";
import data from "./sopData.json";

export function createClipboard(mesh: AbstractMesh, templateString: string): void {
    // Add updateClipboardBehavior
    const scene = mesh.getScene();

    
    // Get DocumentFragment from the SVG template string
    const templateElement = document.createElement("template");
    const template = Handlebars.compile(templateString);
    const html = template(data);
    templateElement.innerHTML = html;

    // Serialize the DocumentFragment to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(templateElement.content);

    const buffer = "data:image/svg+xml;utf8," + encodeURIComponent(svgString);
    const texture = Texture.LoadFromDataString("clipboard-texture", buffer, scene, undefined, undefined, undefined, Texture.LINEAR_LINEAR_MIPNEAREST);

    const material = new StandardMaterial("clipboard-material", scene);
    material.diffuseTexture = texture;
    texture.uScale = 1.0;
    texture.vScale = -1.0;
    material.emissiveColor.copyFrom(Color3.White());
    material.useAlphaFromDiffuseTexture = true;
    texture.hasAlpha = true;
        
    const plane = mesh.getChildMeshes().find(childMesh => childMesh.name === `${mesh.id}-plane`);
    plane.material = material;
}

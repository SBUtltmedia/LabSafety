import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";

export function createPlacard(mesh: Mesh): void {
    const scene = mesh.getScene();
    // NOTE: It is important that the meshes are correctly named.
    const label = mesh.name.split("-")[1];
    const placardBaseMesh = mesh.getChildMeshes().find(childMesh => childMesh.name === "Placard");
    const labelMesh = mesh.getChildMeshes().find(childMesh => childMesh.name === "Label");

    // @todo: Ideally, we wouldn't need to assign this and the label would be correct out of the box.
    placardBaseMesh.id = "placard-base";
    placardBaseMesh.name = "placard-base";

    const texture = new DynamicTexture("dynamic texture", 256, scene);
    texture.wAng = -Math.PI / 2;
    texture.uAng = Math.PI;

    const material = new StandardMaterial("Mat", scene);
    material.diffuseTexture = texture;
    
    labelMesh.material = material;

    const font = "bold 220px monospace";
    texture.drawText(label.toUpperCase(), 65, 185, font, "black", "white");
    placardBaseMesh.addChild(labelMesh);
}

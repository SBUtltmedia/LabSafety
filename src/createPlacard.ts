import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { DynamicTexture, StandardMaterial } from "@babylonjs/core";

export function createPlacard(mesh: Mesh): void {
    // @todo: Would it work if we did createPlacard only once, on the original mesh, and then cloned and renamed it?
    // It seems like it ought to, but I don't know if the clone also affects the textures. Worth investigating.
    // @todo: I have changed the second parameter to be simply the string that should appear on the placard. That seems much simpler.
    const scene = mesh.getScene();
    // NOTE: It is important that the meshes are correctly named.
    const label = mesh.name.split("-")[1];
    // @todo: use constants for these names
    // @todo: Didn't find placardBaseMesh
    console.log(`Looking for child mesh of ${mesh.name} named ${mesh.name}.Placard`);
    const placardBaseMesh = mesh.getChildMeshes().find(childMesh => childMesh.name === "Placard");
    const labelMesh = mesh.getChildMeshes().find(childMesh => childMesh.name === "Label");

    // @todo: Ideally, we wouldn't need to assign this and the label would be correct out of the box.
    placardBaseMesh.id = "placard-base";
    placardBaseMesh.name = "placard-base";

    // @todo: (Note to self) I don't understand this.
    const texture = new DynamicTexture("dynamic texture", 256, scene);
    texture.wAng = -Math.PI / 2;
    texture.uAng = Math.PI;

    const material = new StandardMaterial("Mat", scene);
    material.diffuseTexture = texture;
    
    labelMesh.material = material;

    const font = "bold 220px monospace";
    // @todo: Not a big fan of the way the text is drawn. What if we decide to change the names? It might be fine though.
    texture.drawText(label.toUpperCase(), 65, 185, font, "black", "white");
    placardBaseMesh.addChild(labelMesh);
}

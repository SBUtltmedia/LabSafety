import { AbstractMesh, DynamicTexture, Mesh, StandardMaterial, Vector3 } from "@babylonjs/core";
import { NUMBER_OF_CYLINDERS, PLACARD_MESH_NAME } from "./Constants";

export function createPlacard(meshes: Mesh[], i: number, placardLabel: string) {
    const rootPlacard: Mesh = meshes.find((mesh) => mesh.name === '__root__');
    const scene = rootPlacard.getScene();
    rootPlacard.name = placardLabel;
    const labelPlacard: Mesh = meshes.find((mesh) => mesh.name === 'Label');
    const placard: Mesh = meshes.find((mesh) => mesh.name === 'Placard');
    placard.name = PLACARD_MESH_NAME;
    const texture: DynamicTexture = new DynamicTexture("dynamic texture", 256, scene);
    texture.wAng = -Math.PI / 2;
    texture.uAng = Math.PI;
    const material: StandardMaterial = new StandardMaterial("Mat", scene);
    material.diffuseTexture = texture;
    labelPlacard.material = material;
    const font: string = "bold 220px monospace";
    texture.drawText(rootPlacard.name.split("-")[1].toUpperCase(), 65, 185, font, "black", "white");
    placard.addChild(labelPlacard);
    placard.rotationQuaternion = null;
    placard.rotation = new Vector3(0, Math.PI / 2, 0);
    const table: AbstractMesh = scene.getMeshByName('Table');
    if (table) {
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        rootPlacard.position.y = tableBoundingBox.maximumWorld.y + 0.003;
        rootPlacard.position.x = (((tableBoundingBox.maximumWorld.x - tableBoundingBox.minimumWorld.x) / NUMBER_OF_CYLINDERS) * i) + tableBoundingBox.minimumWorld.x - 0.2;
        rootPlacard.position.z = ((tableBoundingBox.centerWorld.z + tableBoundingBox.minimumWorld.z) / 2) + 0.2;
    }
}
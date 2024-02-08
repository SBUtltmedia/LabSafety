import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";

const RETICLE_CANVAS_SIZE = 64;
const RADIUS = RETICLE_CANVAS_SIZE / 2;
const RETICLE_SIZE = 0.005;

export function CreateReticle(name: string, scene?: Scene): AbstractMesh {
    const texture = new DynamicTexture(name, RETICLE_CANVAS_SIZE);
    const context = texture.getContext();
    context.beginPath();
    context.arc(RADIUS, RADIUS, RADIUS, 0, 2 * Math.PI);
    context.fill();
    texture.update();
    
    const material = new StandardMaterial(name);
    material.diffuseTexture = texture;
    material.opacityTexture = texture;

    const plane = CreatePlane(name, { size: RETICLE_SIZE }, scene);
    plane.material = material;

    return plane;
}

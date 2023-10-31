import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CYLINDER_LIQUID_MESH_NAME } from "./Constants";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { PointerDragBehavior, SixDofDragBehavior, Vector3 } from "@babylonjs/core";
import { InteractableBehavior } from "./InteractableBehavior";

export function createCylinder(mesh: Mesh, color: Color3): void {
    mesh.id = mesh.name;
    const meshIdentifier = mesh.name.split("-")[1];  // "a", "b", "c", etc.
    // @todo: This shouldn't be necessary. These ought to be correct in the files themselves. Well, adding the suffixes might be necessary here.
    mesh.getChildMeshes().forEach(childMesh => {
        if (childMesh.name.split(".").pop() === "BeakerwOpacity") {
            childMesh.name = `base-${meshIdentifier}`;
            childMesh.id = `base-${meshIdentifier}`;
            // childMesh.isPickable = false;  // @todo: Is this correct?
        } else if (childMesh.name.split(".").pop() === "BeakerLiquid") {
            childMesh.name = `${CYLINDER_LIQUID_MESH_NAME}-${meshIdentifier}`;
            childMesh.id = `${CYLINDER_LIQUID_MESH_NAME}-${meshIdentifier}`;
            childMesh.isPickable = false;  // @todo: Is this correct?
        }
    });

    const liquidMesh = mesh.getChildMeshes().find(childMesh => childMesh.name === `${CYLINDER_LIQUID_MESH_NAME}-${meshIdentifier}`);
    const liquidMaterial = new StandardMaterial("liquid-material");
    liquidMaterial.diffuseColor = color;
    liquidMesh.material = liquidMaterial;

    const texture = new DynamicTexture("dynamic-texture", 256, null, true, Texture.LINEAR_LINEAR_MIPNEAREST);
    texture.uAng = Math.PI;
    const material = new StandardMaterial("cylinder-label-material");
    material.diffuseTexture = texture;

    const font = "bold 250px monospace";
    mesh.getChildMeshes().filter(childMesh => childMesh.name.includes("Label")).forEach(m => m.material = material);
    texture.drawText(mesh.name.split("-").pop().toUpperCase(), 0, 225, font, "black", "white");

    const baseMesh = mesh.getChildMeshes().find(childMesh => childMesh.name === `base-${meshIdentifier}`) as Mesh;
    // @todo: Set up an Observable for the cylinder to be highlighted when desired.
    // The reason for this is to avoid creating a class solely to store HighlightLayer information.
    // Add highlighting
    const highlightLayer = new HighlightLayer("highlight-layer");
    highlightLayer.innerGlow = true;
    highlightLayer.outerGlow = false;
    // highlightLayer.addMesh(baseMesh, Color3.Green());

    // Add drag behavior
    // Currently SixDofDragBehavior doesn't work well on desktop, because there is no obvious way to specify a drag plane.
    // const sixDofDragBehavior = new SixDofDragBehavior();
    // sixDofDragBehavior.rotateDraggedObject = false;
    // sixDofDragBehavior.rotateWithMotionController = true;
    // sixDofDragBehavior.dragDeltaRatio = 1;  // Removes default drag slowing (possibly useful in XR)
    // sixDofDragBehavior.allowMultiPointer = false;  // @todo: Do we need this in case the user tries to move it with both hands?
    // baseMesh.addBehavior(sixDofDragBehavior);

    // const pointerDragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) });
    // baseMesh.addBehavior(pointerDragBehavior);

    const interactableBehavior = new InteractableBehavior();
    baseMesh.addBehavior(interactableBehavior);
}

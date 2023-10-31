import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export function enableHighlighting(mesh: Mesh) {
    // @todo: This must be a Mesh, not an AbstractMesh. How can we guarantee that the imported cylinders are Meshes?
    const highlightLayer = new HighlightLayer(`highlight-layer-${mesh.name}`, mesh.getScene());

    highlightLayer.innerGlow = true;
    highlightLayer.outerGlow = false;

    highlightLayer.addMesh(mesh, Color3.Green());
}

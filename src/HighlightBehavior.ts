import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export class HighlightBehavior implements Behavior<Mesh> {
    highlightLayer: HighlightLayer;
    mesh: Mesh;
    otherMesh?: Mesh;
    color: Color3;

    constructor(color: Color3) {
        this.highlightLayer = new HighlightLayer("highlight-layer");
        this.highlightLayer.innerGlow = true;
        this.highlightLayer.outerGlow = false;
        this.color = color;
    }

    get name() {
        return "Highlight";
    }

    init() {

    }

    attach = (mesh: Mesh) => {
        console.log("Attach!")
        this.mesh = mesh;
    }

    detach = () => {
        this.unhighlightAll();
    }

    highlightSelf = (color:Color3) => {
        if (this.mesh !== undefined && !this.highlightLayer.hasMesh(this.mesh)) {
            this.highlightLayer.addMesh(this.mesh, color);
        }
    }

    highlightOther = (otherMesh: Mesh,color: Color3) => {
        if (!this.highlightLayer.hasMesh(otherMesh)) {
            this.otherMesh = otherMesh;
            this.highlightLayer.addMesh(this.otherMesh, color);
        }
    }

    unhighlightSelf = () => {
        if (this.mesh !== undefined && this.highlightLayer.hasMesh(this.mesh)) {
            this.highlightLayer.removeMesh(this.mesh);
        }
    }

    unhighlightOther = () => {
        if (this.otherMesh && this.highlightLayer.hasMesh(this.otherMesh)) {
            this.highlightLayer.removeMesh(this.otherMesh);
        }
    }

    unhighlightAll = () => {
        if (this.highlightLayer.hasMesh(this.mesh)) {
            this.highlightLayer.removeMesh(this.mesh);
        }
        if (this.otherMesh && this.highlightLayer.hasMesh(this.otherMesh)) {
            this.highlightLayer.removeMesh(this.otherMesh);
        }
    }
}

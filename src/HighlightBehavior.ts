import { Behavior, Color3, HighlightLayer, Mesh } from "@babylonjs/core";

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

    static get name() {
        return "Highlight";
    }

    get name() {
        return "Highlight";
    }

    init() {

    }

    attach = (mesh: Mesh) => {
        this.mesh = mesh;
    }

    detach = () => {
        this.unhighlightAll();
    }

    highlightSelf = () => {
        if (!this.highlightLayer.hasMesh(this.mesh)) {
            this.highlightLayer.addMesh(this.mesh, this.color);
        }
    }

    highlightOther = (otherMesh: Mesh) => {
        if (!this.highlightLayer.hasMesh(otherMesh)) {
            this.otherMesh = otherMesh;
            this.highlightLayer.addMesh(this.otherMesh, this.color);
        }
    }

    unhighlightSelf = () => {
        if (this.highlightLayer.hasMesh(this.mesh)) {
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

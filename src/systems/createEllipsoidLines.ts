import { AbstractMesh, Color3, Vector3 } from "@babylonjs/core";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export class CreateEllipsoidLines {
    ellipsoid: Vector3;
    base: AbstractMesh;
    ellipsoidOffset: Vector3;
    constructor( base: AbstractMesh) {
        this.base = base;
        this.ellipsoid = base.ellipsoid;  
        this.ellipsoidOffset = this.base.ellipsoidOffset
        this.drawLines()
    }

    drawLines() {
        const a = this.ellipsoid.x;
        const b = this.ellipsoid.y;
        const points = [];
        for (let theta = -Math.PI / 2; theta < Math.PI / 2; theta += Math.PI / 36) {
            points.push(new Vector3(0, b * Math.sin(theta) +  this.base.ellipsoidOffset.y, a * Math.cos(theta)));
        }

        const ellipse = [];
        ellipse[0] = MeshBuilder.CreateLines("e", { points: points }, this.base.getScene());
        ellipse[0].color = Color3.Red();
        ellipse[0].parent =  this.base;
        const steps = 12;
        const dTheta = 2 * Math.PI / steps;
        for (let i = 1; i < steps; i++) {
            ellipse[i] = ellipse[0].clone("el" + i);
            ellipse[i].parent =  this.base;
            ellipse[i].rotation.y = i * dTheta;
        }

    }

}
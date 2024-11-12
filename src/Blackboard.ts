import { AbstractMesh, DynamicTexture, ICanvasRenderingContext, Mesh, Scene, StandardMaterial } from "@babylonjs/core";
import { interactionManager } from "./scene";

function getLines(ctx: ICanvasRenderingContext, text: string, maxWidth: number) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}  

export const createBlackboard = (bbMesh: AbstractMesh) => {
    // bbMesh.position.addInPlaceFromFloats(0, 2.3, 1);
    drawBBText("My text that I want to display My text that I want to display My text that I want to display My text that I want to display My text that I want to display My text that I want to display My text that I want to display My text that I want to display My text that I want to display My text that I want to display My text that I want to display");
};

export const drawBBText = (text: string) => {
    const scene = interactionManager.scene;
    const bbMesh = scene.getTransformNodeByName("blackboard");
    const plane = bbMesh.getChildMeshes().find(mesh => mesh.name === "Surface");

    const scaleFactor = 1024;
    const boundingBox = plane.getBoundingInfo().boundingBox;

    const textureWidth = scaleFactor * (boundingBox.maximum.x - boundingBox.minimum.x);
    const textureHeight = scaleFactor * (boundingBox.maximum.y - boundingBox.minimum.y);

    const fontSize = 120;
    const font = `bold ${fontSize}px 'Margarine'`;
    const mat = new StandardMaterial("Name", scene);
    mat.backFaceCulling = false;
    const texture = new DynamicTexture("testText", { width: textureWidth, height: textureHeight }, scene);
    texture.hasAlpha = true;
    mat.diffuseTexture = texture;
    plane.material = mat;
    var canvas = texture.getContext();

    const textureX = textureWidth / 10;
    const textureY = textureHeight / 10;
    const paddingY = textureY * 2.60;

    const textureXScalingFactor = 0.85;

    canvas.fillStyle = "transparent"; // Note: #000000 here also gives a black background
    texture.clear();
    const lines = getLines(canvas, text, textureX * textureXScalingFactor);
    console.log(lines);
    const leading = 20;
    lines.forEach((line, idx) => {
        console.log(line, idx);
        texture.drawText(line, plane.position.x, paddingY + textureY + ((fontSize + leading) * idx), font, "white", "transparent", true, true);
    })

}
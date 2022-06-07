import { Engine } from '@babylonjs/core/Engines/engine';
import { createScene } from "./scene";

type config = {
    mode: 'desktop' | 'vr'
}

const CONFIG: config = {
    mode: 'vr'
};

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // Get the canvas element
const engine = new Engine(canvas, true); // Generate the BABYLON 3D engine

// Add your code here matching the playground format

createScene(engine, canvas).then(scene => engine.runRenderLoop(function() { scene.render(); }));
// Register a render loop to repeatedly render the scene

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});

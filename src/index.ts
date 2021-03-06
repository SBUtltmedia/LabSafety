import { Engine } from '@babylonjs/core/Engines/engine';
import { createScene } from "./scene";


const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);

createScene(engine, canvas).then(scene => engine.runRenderLoop(function() { scene.render(); }));

window.addEventListener("resize", function () {
    engine.resize();
});

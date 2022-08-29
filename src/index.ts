import { Engine } from '@babylonjs/core/Engines/engine';

import { createScene } from './scene';

import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';

import './globals';  // Instantiate global objects
 
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true, { stencil: true });

createScene(engine, canvas).then(scene => engine.runRenderLoop(function() { scene.render(); }));

window.addEventListener("resize", function () {
    engine.resize();
});

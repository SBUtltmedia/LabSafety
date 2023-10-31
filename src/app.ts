import "@babylonjs/core/Materials/Node/Blocks";
import "@babylonjs/core/Loading/loadingScreen";

import "@babylonjs/loaders/glTF"; // To enable loading .glb meshes
import "@babylonjs/core/Helpers/sceneHelpers"; // To enable creating the default XR experience
import "@babylonjs/core/Collisions/collisionCoordinator"; // To enable collisions
import "@babylonjs/core/Audio/audioSceneComponent";

import { log } from "./utils";
import { createSceneAsync } from "./scene";
import { setUpEngine } from "./setUpEngine";
import { Engine } from "@babylonjs/core/Engines/engine";

if (import.meta.env.DEV) {
    console.log("Running in development mode");
}

// document.addEventListener('DOMContentLoaded', function () {
//     const splash = document.querySelector("div.splash");
//     splash.addEventListener("click", () => {
//         splash.classList.add("hide");
//   });
// }, false);

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

// The stencil engine option is necessary for mesh highlighting to work.
const engine = new Engine(canvas, true, { stencil: true });
setUpEngine(engine);
createSceneAsync(engine).then(scene => {
    engine.runRenderLoop(() => scene.render())
});

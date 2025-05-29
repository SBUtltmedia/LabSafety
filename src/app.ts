import "@babylonjs/core/Audio/audioSceneComponent";
import "@babylonjs/core/Materials/Node/Blocks";
import "@babylonjs/core/Collisions/collisionCoordinator"; // To enable collisions
import "@babylonjs/loaders/glTF"; // To enable loading .glb meshes
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Helpers/sceneHelpers"; // To enable creating the default XR experience
import 'pepjs'
import { createSceneAsync } from "./scene";
import { setUpEngine } from "./managers/setUpEngine";
import { Engine } from "@babylonjs/core/Engines/engine";

if (import.meta.env.DEV) {
    console.log("Running in development mode");
}

const canvas = document.getElementById("canvas") as unknown as HTMLCanvasElement;

// The stencil engine option is necessary for mesh highlighting to work.
const engine = new Engine(canvas, true, { stencil: true });
setUpEngine(engine);
createSceneAsync(engine).then(scene => {
    engine.runRenderLoop(() => scene.render())
});

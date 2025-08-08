import "@babylonjs/core/Audio/audioSceneComponent";
import "@babylonjs/core/Materials/Node/Blocks";
import "@babylonjs/core/Collisions/collisionCoordinator";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Helpers/sceneHelpers";
import 'pepjs';

import { setUpEngine } from "./systems/setUpEngine";
import { Engine } from "@babylonjs/core/Engines/engine";


import { SceneManager } from "./managers/scene/SceneManager";
import { HelloScene } from "./scenes/HelloScene";
import { sceneActionDispatcher } from "./managers/scene/sceneEvents";

if (import.meta.env.DEV) {
    console.log("Running in development mode");
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true, { stencil: true });
setUpEngine(engine);

const sceneManager = new SceneManager(canvas);

// Publish the initial scene loading event to the observable
sceneActionDispatcher.notifyObservers({
    scene: new HelloScene(),
    action: 'load'
});
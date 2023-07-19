import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import "@babylonjs/core/Materials/Node/Blocks";
import "@babylonjs/core/Loading/loadingScreen";

import "@babylonjs/loaders/glTF"; // To enable loading .glb meshes
import "@babylonjs/core/Helpers/sceneHelpers"; // To enable creating the default XR experience
// import '@babylonjs/core/Rendering/boundingBoxRenderer';  // To render bounding boxes
import "@babylonjs/core/Collisions/collisionCoordinator"; // To enable collisions
import "@babylonjs/core/Audio/audioSceneComponent";

import { SceneManager } from "./SceneManager";


// console.log = () => {};

export class App {
  constructor() {
    let sceneManager: SceneManager = new SceneManager();
    sceneManager.createSceneOne();
  }
}

new App();


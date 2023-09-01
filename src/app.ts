// import "@babylonjs/core/Debug/debugLayer";
// import "@babylonjs/inspector";

import "@babylonjs/core/Materials/Node/Blocks";
import "@babylonjs/core/Loading/loadingScreen";

import "@babylonjs/loaders/glTF"; // To enable loading .glb meshes
import "@babylonjs/core/Helpers/sceneHelpers"; // To enable creating the default XR experience
// import '@babylonjs/core/Rendering/boundingBoxRenderer';  // To render bounding boxes
import "@babylonjs/core/Collisions/collisionCoordinator"; // To enable collisions
import "@babylonjs/core/Audio/audioSceneComponent";

import { SceneManager } from "./SceneManager";


// console.log = () => { };

if (import.meta.env.DEV) {
  console.log("Running in development mode");
} else if (import.meta.env.PROD) {
  console.log("Running in production mode");
}

export class App {
  constructor() {
    let sceneManager: SceneManager = new SceneManager();
    sceneManager.createSceneOne();
  }
}

document.addEventListener('DOMContentLoaded', function () {

  let splash = document.querySelector("div.splash");
  splash.addEventListener("click", () => {
    splash.classList.add("hide")
    console.log("Click")
  })
}, false);


new App();


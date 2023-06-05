// import "@babylonjs/core/Debug/debugLayer";
// import "@babylonjs/inspector";

import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Light } from "@babylonjs/core/Lights/light";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import { Cylinder } from "./Cylinder";
import { createClipboard } from "./LoadClipboard";
import { defaultCallBack } from "./DefaultCallback";
import { createPlacard } from "./CreatePlarcard";
import { addWebXR } from "./addWebXR";
import { addXRBehaviors } from "./addXRBehaviors";
import SOP from "./SOP";
import { SceneManager } from "./PostSceneCylinderBehavior";
import FlyToCameraBehavior from "./FlyToCameraBehavior";
import { rootPath } from "./Constants";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience.js";
import "@babylonjs/core/Materials/Node/Blocks";
import "@babylonjs/core/Loading/loadingScreen";

import "@babylonjs/loaders/glTF"; // To enable loading .glb meshes
import "@babylonjs/core/Helpers/sceneHelpers"; // To enable creating the default XR experience
// import '@babylonjs/core/Rendering/boundingBoxRenderer';  // To render bounding boxes
import "@babylonjs/core/Collisions/collisionCoordinator"; // To enable collisions
import "@babylonjs/core/Audio/audioSceneComponent";

//import { Observer } from '@babylonjs/core'
import { GUIManager } from "./GUIManager";
import { SoundManager } from "./SoundManager";
import { WebXRFeatureName } from "@babylonjs/core/XR/webXRFeaturesManager";

console.log = () => {};

export class App {
  handAnimation: any;
  sop: SOP;
  models: any;
  cylinders: any;
  guiManager: GUIManager;
  soundManager: SoundManager;
  loadedSounds: Array<any>;

  constructor() {
    this.cylinders = [];
    let cylinderName = "CylinderNewSmoothLabel.glb";
    this.models = [
      //{ "fileName": "RoomandNewLabBench.glb", "callback": mesh => createRoom(mesh), "label": "floor" },
      {
        fileName: "room.glb",
        callback: (mesh: Mesh[]) => this.createRoom(mesh),
        label: "floor",
      },
      {
        fileName: "Placard_Label.glb",
        callback: (mesh: Mesh[]) => createPlacard(mesh, 1, "Placard-A"),
      },
      {
        fileName: "Placard_Label.glb",
        callback: (mesh: Mesh[]) => createPlacard(mesh, 2, "Placard-B"),
      },
      {
        fileName: "Placard_Label.glb",
        callback: (mesh: Mesh[]) => createPlacard(mesh, 3, "Placard-C"),
      },
      {
        fileName: cylinderName,
        callback: (mesh: Mesh[]) =>
          this.cylinders.push(
            new Cylinder(mesh[0], 1, "A", new Color3(1, 0, 0))
          ),
        label: "Cylinder-A",
      },
      {
        fileName: cylinderName,
        callback: (mesh: Mesh[]) =>
          this.cylinders.push(
            new Cylinder(mesh[0], 2, "B", new Color3(0, 1, 0))
          ),
        label: "Cylinder-B",
      },
      {
        fileName: cylinderName,
        callback: (mesh: Mesh[]) =>
          this.cylinders.push(
            new Cylinder(mesh[0], 3, "C", new Color3(0, 0, 1))
          ),
        label: "Cylinder-C",
      },
      {
        fileName: "clipBoardWithPaperCompressedTextureNew.glb",
        callback: (mesh: Mesh[]) => createClipboard(mesh[0]),
      },
      // "root":"https://raw.githubusercontent.com/PatrickRyanMS/SampleModels/master/Yeti/glTF/" }
    ].map(function (model) {
      return Object.assign(
        {},
        {
          fileName: "LabBench.glb",
          root: "./models/",
          callback: defaultCallBack,
          label: "NoLabel",
        },
        model
      );
    });

    let soundObjects = [
      {
        soundName: "explosion",
        fileName: `${rootPath}/sound/mi_explosion_03_hpx.mp3`,
      },
      { soundName: "ding", fileName: `${rootPath}/sound/ding-idea-40142.mp3` },
      { soundName: "success", fileName: `${rootPath}/sound/success.mp3` },
    ];
    this.loadedSounds = [];

    this.createScene().then((scene: Scene) => {
      this.soundManager = new SoundManager(soundObjects, scene);
      this.soundManager.loadSounds().then((sounds: Array<any>) => {
        this.loadedSounds = sounds;
        let positions = {};
        for (let i of ["A", "B", "C"]) {
          positions[`pivot-Cylinder-${i}`] = Object.assign(
            {},
            scene.getMeshByName(`pivot-Cylinder-${i}`).position
          );
        }
        console.log("Loaded sounds: ", this.loadedSounds);
        for (let sound of this.loadedSounds) {
          // this.soundManager.loadedSounds[sound.soundName] = sound.sound;
          console.log(sound.sound);
        }

        this.processScene(
          scene,
          this.cylinders,
          this.soundManager
        );
      });
      // this.guiManager.createPromptWithButton("You have completed the task! The scene will now reset!");
    });
  }
  //Can be turn back on if Z axis gets messed up

  async processScene(
    scene: Scene,
    cylinders: Array<Cylinder>,
    soundManager: SoundManager
  ) {
    let camera = scene.getCameraByName("camera") as UniversalCamera;

    let light: Light = scene.getLightByName("light1");
    let xrCamera: WebXRDefaultExperience;
    //light.intensity = 1;
    camera.speed = 0.16;
    let cameraFadeIn = setInterval(() => {
      if (light.intensity >= 1) {
        clearInterval(cameraFadeIn);
      } else {
        light.intensity += 0.1;
      }
    }, 60);

    const wantedCollisions = ["WallsandFloor", "Floor"];
    const floorMesh = [];
    for (let getStringMesh of wantedCollisions) {
      console.log(getStringMesh);
      const getCollidableMesh: Mesh = scene.getMeshByName(
        getStringMesh
      ) as Mesh;
      if (getCollidableMesh) {
        floorMesh.push(getCollidableMesh);
      }
    }
    let xrOptions = {
      floorMeshes: [scene.getMeshByName("Floor")],
      inputOptions: {
        doNotLoadControllerMeshes: true,
      },
    };

    xrCamera = await scene.createDefaultXRExperienceAsync(xrOptions);

    const featuresManager = xrCamera.baseExperience.featuresManager;

    const teleportation = featuresManager.enableFeature(WebXRFeatureName.TELEPORTATION, "stable", {
      xrInput: xrCamera.input,
      floorMeshes: [scene.getMeshByName("Floor")],
      timeToTeleport: 5000,

    });
//@ts-ignore
    xrCamera.teleportation = teleportation;

    xrCamera.teleportation.parabolicRayEnabled = true;
    xrCamera.teleportation.parabolicCheckRadius = 10;



    let displayPtr = false;

    xrCamera.pointerSelection.laserPointerDefaultColor = Color3.Green();
    xrCamera.pointerSelection.laserPointerPickedColor = Color3.Green();
    xrCamera.pointerSelection.selectionMeshPickedColor = Color3.Green();
    xrCamera.pointerSelection.selectionMeshDefaultColor = Color3.Green();

    xrCamera.pointerSelection.displayLaserPointer = false;
    xrCamera.pointerSelection.displaySelectionMesh = false;

    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.keyCode === 73) {
        if (!displayPtr) {
          displayPtr = true;
        } else {
          displayPtr = false;
        }
        xrCamera.pointerSelection.displayLaserPointer = displayPtr;
        xrCamera.pointerSelection.displaySelectionMesh = displayPtr;
      }
    });

    addWebXR(scene, xrCamera, cylinders).then((addHandModels) => {
      console.log("add webxr");
      if (xrCamera) {
        const flyToCamera = new FlyToCameraBehavior(xrCamera.baseExperience);
        const clipboard = scene.getMeshByName("clipboard");
        clipboard.addBehavior(flyToCamera);
      }
      this.guiManager = new GUIManager(scene);
      this.guiManager.createPromptWithButton(
        "Welcome to the Lab Safety Simulation. Click on the clipboard to learn more about the simulation!",
        xrCamera
      );

      console.log("Cylinders app: ", cylinders);

      let sceneManger: SceneManager = new SceneManager(
        scene,
        cylinders,
        this.guiManager,
        soundManager,
        xrCamera
      );
      sceneManger.postSceneCylinder();
      var toggleControllers = addXRBehaviors(
        scene,
        xrCamera,
        addHandModels,
        cylinders,
        this.guiManager,
        this.soundManager
      );
      toggleControllers();
      for(let cylinder of  cylinders){
        cylinder.toggleControllers =toggleControllers; 

      }
    });
  }

  createRoom(mesh: Mesh[]) {
    const wantedCollisions = [
      "WallsandFloor",
      "Floor",
      "Table",
      "Roof",
      "Countertop",
      "Walls",
    ];
    let scene: Scene, camera: UniversalCamera;
    for (let getStringMesh of wantedCollisions) {
      const getCollidableMesh: Mesh = mesh.find(
        (mesh) => mesh.name === getStringMesh
      )!;
      if (getCollidableMesh) {
        getCollidableMesh.checkCollisions = true;
        if (getCollidableMesh.name === "Table") {
          const tableBoundingBox: BoundingBox =
            getCollidableMesh.getBoundingInfo().boundingBox;
          const cameraXPosition = tableBoundingBox.center.x;
          scene = getCollidableMesh.getScene();
          camera = scene.getCameraByName("camera") as UniversalCamera;
          camera.position = new Vector3(
            tableBoundingBox.center.x * -1,
            tableBoundingBox.center.y * 2 + 0.5,
            -1.5
          );
          camera.rotation = new Vector3(Math.PI / 8, 0, 0);
        }
      }
    }
    //Set the speed here so we have the room loaded before the user can move around.
  }

  createScene() {
    return new Promise((finishedAllModels) => {
      const canvas = document.getElementById("canvas") as HTMLCanvasElement;
      const engine = new Engine(canvas, true, { stencil: true });
      const scene = new Scene(engine);
      // scene.debugLayer.show();
      //scene.gravity.y = -0.01
      scene.collisionsEnabled = true;
      window.addEventListener("resize", function () {
        engine.resize();
      });
      // checkIfDebug(scene);
      const camera = new UniversalCamera(
        "camera",
        new Vector3(0, 1, -1.134),
        scene
      );
      //camera.cameraDirection = new Vector3(0.1, 0.1, 0.1);
      camera.ellipsoid = new Vector3(0.4, 0.7, 0.4);

      camera.attachControl(canvas, true);
      camera.applyGravity = true;
      camera.minZ = 0.0; // To prevent clipping through near meshes
      camera.speed = 0;
      camera.checkCollisions = true;
      camera.keysUp.push(87); // W
      camera.keysDown.push(83); // S
      camera.keysLeft.push(65); // A
      camera.keysRight.push(68); // D

      var light1: HemisphericLight = new HemisphericLight(
        "light1",
        new Vector3(1, 1, 0),
        scene
      );
      light1.intensity = 0;
      Promise.all(
        this.models.map((model) => {
          return new Promise((resolve) =>
            SceneLoader.ImportMesh(
              "",
              model["root"],
              model.fileName,
              scene,
              function (container) {
                model["mesh"] = container;
                resolve(container);
              }
            )
          );
        })
      ).then(() => {
        let callbackResults = [];
        this.models.map((model) => {
          callbackResults.push(model["callback"](model["mesh"]));
          finishedAllModels(scene);
        });
        let [a, b, c, ...d] = callbackResults;
      });

      window.addEventListener("keydown", (ev) => {
        // Shift+Ctrl+Alt+I
        if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
          if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
          } else {
            scene.debugLayer.show();
          }
        }
      });
      // run the main render loop
      engine.runRenderLoop(() => {
        scene.render();
      });
    });
  }
}

new App();

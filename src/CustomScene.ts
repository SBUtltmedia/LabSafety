import { Engine } from "@babylonjs/core/Engines/engine";
import { GUIManager } from "./GUIManager";;
import { SoundManager } from "./SoundManager";
import { Scene, UniversalCamera, Vector3,
        HemisphericLight, SceneLoader, Color3, Light, WebXRDefaultExperience, Color4, KeyboardEventTypes } from "@babylonjs/core";
import { Cylinder } from "./Cylinder";
import FlyToCameraBehavior from "./FlyToCameraBehavior";
import { PostSceneCylinder } from "./PostSceneCylinder";
import { XR } from "./XR";
import { FireExtinguisher } from "./FireExtinguisher";

export class CustomScene {
    models: any
    cylinders: any
    guiManager: GUIManager
    soundManager: SoundManager
    soundObjects: any
    loadedSounds: any
    scene: Scene
    fireExtinguisher: FireExtinguisher

    constructor(models: any, cylinders: any, soundObjects: any, fireExtinguisher: FireExtinguisher) {
      this.models = models;
      this.cylinders = cylinders;
      this.soundObjects = soundObjects;
      this.fireExtinguisher = fireExtinguisher;
    }

    renderScene() {
      this.createScene().then((scene: Scene) => {
        this.scene = scene;
        // this.scene.clearColor = new Color4(0,0,0,0);
        this.soundManager = new SoundManager(this.soundObjects, scene);
        this.soundManager.enableAudio();
        this.soundManager.loadSounds().then((sounds: Array<any>) => {
        this.loadedSounds = sounds;
          this.processScene(
            scene,
            this.cylinders,
            this.soundManager,
          );
        });
      })
    }

    disposeScene() {
      this.scene.meshes.forEach((mesh) => {
        mesh.dispose();
      })

      this.scene.materials.forEach((material) => {
        material.dispose();
      });

      this.scene.textures.forEach((texture) => {
        texture.dispose();
      });

      this.scene.lights.forEach((light) => {
        light.dispose();
      });

      this.scene.customRenderTargets.forEach((renderTarget) => {
        renderTarget.dispose();
      });

      // wait for the meshes to dispose and then dispose the scene
      setTimeout(() => this.scene.dispose(), 1000);
    
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

          let move = 0.0;

          // scene.onKeyboardObservable.add((kbInfo) => {
          //   switch (kbInfo.type) {
          //     case KeyboardEventTypes.KEYDOWN:
          //       switch (kbInfo.event.key) {
          //                   case "a":
          //                   case "A":
          //                       camera.position.x -= move;
          //                   break
          //                   case "d":
          //                   case "D":
          //                       camera.position.x += move;
          //                   break
          //                   case "w":
          //                   case "W":
          //                       camera.position.z += move;
          //                   break
          //                   case "s":
          //                   case "S":
          //                       camera.position.z -= move;
          //                   break
          //               }
          //     break;
          //   }
          // });          
    
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

    async processScene(
        scene: Scene,
        cylinders: Array<Cylinder>,
        soundManager: SoundManager,
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
     
        let xrOptions = {
          floorMeshes: [scene.getMeshByName("Floor")],
          inputOptions: {
            doNotLoadControllerMeshes: true,
          },
        };
    
        xrCamera = await scene.createDefaultXRExperienceAsync(xrOptions);
    
        xrCamera.baseExperience.camera.position.z -= 0.5
    
        let displayPtr = false;
    
        xrCamera.pointerSelection.laserPointerDefaultColor = Color3.Green();
        xrCamera.pointerSelection.laserPointerPickedColor = Color3.Green();
        xrCamera.pointerSelection.selectionMeshPickedColor = Color3.Green();
        xrCamera.pointerSelection.selectionMeshDefaultColor = Color3.Green();
    
        xrCamera.pointerSelection.displayLaserPointer = false;
        xrCamera.pointerSelection.displaySelectionMesh = false;

        this.fireExtinguisher.xrCamera = xrCamera;        
    
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

        console.log(this.fireExtinguisher);

        this.guiManager = new GUIManager(scene);
        this.guiManager.createPromptWithButton(
          "Welcome to the Lab Safety Simulation. Click on the clipboard to learn more about the simulation!",
          xrCamera
        );        
    
        let xr: XR = new XR(scene, xrCamera, null, cylinders, null, this.soundManager, this.fireExtinguisher);
        xr.guiManager = this.guiManager;
    
        xr.addWebXr().then((addHandModels) => {
    
          if (xrCamera) {
            const flyToCamera = new FlyToCameraBehavior(xrCamera.baseExperience);
            const clipboard = scene.getMeshByName("clipboard");
            clipboard.addBehavior(flyToCamera);
          }
    
          xr.guiManager = this.guiManager;

          console.log(this.fireExtinguisher);
    
          xr.addHandModels = addHandModels;
    
          let desktopScene: PostSceneCylinder = new PostSceneCylinder(
            scene,
            cylinders,
            this.guiManager,
            soundManager,
            xrCamera,
            this.fireExtinguisher
          );
          desktopScene.postSceneCylinder();
          var toggleControllers = xr.addWebXrBehaviors();
          toggleControllers();
          for(let cylinder of  cylinders){
            cylinder.toggleControllers = toggleControllers;
          }
        });
    }
};
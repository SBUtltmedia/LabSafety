import { Mesh, Color3, ActionManager, BoundingBox,
     ExecuteCodeAction, Scene, UniversalCamera, 
     Vector3, Animation, Color4 } from "@babylonjs/core";

import { createPlacard } from "./CreatePlarcard";
import { Cylinder } from "./Cylinder";
import { defaultCallBack } from "./DefaultCallback";
import { FireCabinet } from "./FireCabinet";
import { GUIManager } from "./GUIManager";
import { createClipboard } from "./LoadClipboard";
import SOP from "./SOP";
import { SoundManager } from "./SoundManager";
import { MAX_DISPLACEMENT_PER_FRAME, rootPath } from "./Constants";
import { CustomScene } from "./CustomScene";
import { FireExtinguisher } from "./FireExtinguisher";
import { Fire } from "./Fire";

export class SceneManager {

    currentScene: CustomScene;

    constructor() {
    }

    disposeCurrentScene() {
        this.currentScene.disposeScene();
    }

    createSceneOne() {
        let fireCabinet: FireCabinet
        let cylinders = [];
        let cylinderName = "CylinderNewSmoothLabel.glb";
        let fireExtinguisher: FireExtinguisher = new FireExtinguisher();
        let models = [
            // { "fileName": "RoomandNewLabBench.glb", "callback": mesh => createRoom(mesh), "label": "floor" },
            {
              fileName: "room.glb",
              callback: (mesh: Mesh[]) => createRoom(mesh),
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
                cylinders.push(
                  new Cylinder(mesh[0], 1, "A", new Color3(1, 0, 0))
                ),
              label: "Cylinder-A",
            },
            {
              fileName: cylinderName,
              callback: (mesh: Mesh[]) =>
                cylinders.push(
                  new Cylinder(mesh[0], 2, "B", new Color3(0, 1, 0))
                ),
              label: "Cylinder-B",
            },
            {
              fileName: cylinderName,
              callback: (mesh: Mesh[]) =>
                cylinders.push(
                  new Cylinder(mesh[0], 3, "C", new Color3(0, 0, 1))
                ),
              label: "Cylinder-C",
            },
            {
              fileName: "clipBoardWithPaperCompressedTextureNew.glb",
              callback: (mesh: Mesh[]) => createClipboard(mesh[0]),
            },
            {
              fileName: "fireExtinguisher.glb",
              callback: (mesh: Mesh[]) => {
                let model = mesh[0];
                // model.position.y = 1;
                fireExtinguisher.setModel(model);
              }
            }
            // {
            //   fileName: "fireAlarm.glb",
            //   callback: (mesh: Mesh[]) => createFireAlarm(mesh[0]),
            // }
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

        this.currentScene = new CustomScene(models, cylinders, soundObjects, fireExtinguisher);
        this.currentScene.renderScene();
        

        function createRoom(mesh: Mesh[]) {
            fireCabinet = new FireCabinet(mesh);
            fireExtinguisher.fireCabinetInstance = fireCabinet;
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
                  let fire = new Fire(scene);                  
                  camera.position = new Vector3(
                    tableBoundingBox.center.x - 0.5,
                    tableBoundingBox.center.y * 2 + 1.75,
                    -1.5
                  );
                  camera.rotation = new Vector3(Math.PI / 8, 0, 0);

                  let cameraPosition = camera.position.clone();
                  scene.onBeforeRenderObservable.add(() => {
                    const displacementVector = camera.position.subtract(cameraPosition);
                    const displacementLength = displacementVector.length();
                    if (displacementLength > MAX_DISPLACEMENT_PER_FRAME) {
                      // Reduce the length of the jump from displacementLength to 0.01 to get the player "unstuck"
                      camera.position = cameraPosition.addInPlace(displacementVector.scale(0.01/displacementLength));
                    }
                    cameraPosition = camera.position.clone();
                  });
                }
              }
            }
            //Set the speed here so we have the room loaded before the user can move around.
        }
        
        function createFireAlarm(mesh: Mesh[]) {
            const root = mesh.find(mesh => mesh.name === '__root__')!;
              
            root.rotationQuaternion = null
            root.rotation.y= .5*Math.PI
            const frameRate=10
            const xSlide = new Animation("xSlide", "rotation.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            const lever = mesh.find(mesh => mesh.name === 'LeverRedone'); 
            lever.rotationQuaternion = null
            let scene: Scene
            scene = mesh[0].getScene();
           
            lever.actionManager = new ActionManager(scene);
            lever.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickUpTrigger, function () {
                scene.beginAnimation(  lever, 0, 2 * frameRate, true);
            }));
        
            xSlide.setKeys([{
                frame: 0,
                value: 0
            },{
                frame: frameRate,
                value:- .5* Math.PI
            }]);
        
            lever.animations.push(xSlide);

        }        
    }

}
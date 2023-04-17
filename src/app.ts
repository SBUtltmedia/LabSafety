import "@babylonjs/core/Debug/debugLayer";
// import "@babylonjs/inspector";

import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Light } from "@babylonjs/core/Lights/light";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
// import { checkIfDebug } from "./utils";
import { Cylinder } from "./Cylinder";
import { createClipboard } from "./LoadClipboard";
import { defaultCallBack } from "./DefaultCallback";
import { createPlacard } from "./CreatePlarcard";
import { addWebXR } from "./addWebXR";
import { addXRBehaviors } from "./addXRBehaviors";
import SOP from './SOP';
import { SceneManager } from "./PostSceneCylinderBehavior";
import FlyToCameraBehavior from "./FlyToCameraBehavior";
import { sop } from "./Constants";
import { WebXRDefaultExperience } from "@babylonjs/core";
import '@babylonjs/core/Materials/Node/Blocks';
import "@babylonjs/core/Loading/loadingScreen";

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
// import '@babylonjs/core/Rendering/boundingBoxRenderer';  // To render bounding boxes
import '@babylonjs/core/Collisions/collisionCoordinator';  // To enable collisions
import '@babylonjs/core/Audio/audioSceneComponent';

import { Observer } from '@babylonjs/core'

// console.log = () => { }

export class App {
    handAnimation: any;
    sop: SOP;
    models: any;
    cylinders: any;
    constructor() {
        this.cylinders = []
        let cylinderName = "TLLGraduatedCylinderNewLabel.glb"
        this.models = [
            //{ "fileName": "RoomandNewLabBench.glb", "callback": mesh => createRoom(mesh), "label": "floor" },
            { "fileName": "NewLaboratoryUNFINISHED.glb", "callback": (mesh: Mesh[]) => this.createRoom(mesh), "label": "floor" },
            { "fileName": "clipBoardWithPaperCompressedTextureNew.glb", "callback": (mesh: Mesh[]) => createClipboard(mesh[0]) },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 1, "Placard-A") },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 2, "Placard-B") },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 3, "Placard-C") },
            { "fileName": cylinderName, "callback": (mesh: Mesh[]) => this.cylinders.push(new Cylinder(mesh[0], 1, "A", new Color3(1, 0, 0))), "label": "Cylinder-A" },
            { "fileName": cylinderName, "callback": (mesh: Mesh[]) => this.cylinders.push(new Cylinder(mesh[0], 2, "B", new Color3(0, 1, 0))), "label": "Cylinder-B" },
            { "fileName": cylinderName, "callback": (mesh: Mesh[]) => this.cylinders.push(new Cylinder(mesh[0], 3, "C", new Color3(0, 0, 1))), "label": "Cylinder-C" }
            // "root":"https://raw.githubusercontent.com/PatrickRyanMS/SampleModels/master/Yeti/glTF/" }
        ].map(function (model) {
            return Object.assign({}, { fileName: "LabBench.glb", root: "./models/", callback: defaultCallBack, label: "NoLabel" }, model)
        })


        this.createScene().then((scene: Scene) => {
            let positions = {}
            for (let i of ["A", "B", "C"]) {
                positions[`pivot-Cylinder-${i}`] = Object.assign({}, scene.getMeshByName(`pivot-Cylinder-${i}`).position);

            }
            this.processScene(scene, this.cylinders);
        });

    }
    //Can be turn back on if Z axis gets messed up

    async processScene(scene: Scene, cylinders: Array<Cylinder>) {

        let camera = (scene.getCameraByName('camera') as UniversalCamera);
        let light: Light = scene.getLightByName('light1');
        let xrCamera: WebXRDefaultExperience;
        //light.intensity = 1;
        camera.speed = 0.16;
        let cameraFadeIn = setInterval(() => {
            if (light.intensity >= 1) {
                clearInterval(cameraFadeIn);
            } else {
                light.intensity += 0.10;
            }
        }, 60)
        const wantedCollisions = [
            'WallsandFloor',
            'WallsAndFloor.001',
        ]
        const floorMesh = []
        for (let getStringMesh of wantedCollisions) {
            console.log(getStringMesh);
            const getCollidableMesh: Mesh = scene.getMeshByName(getStringMesh) as Mesh;
            if (getCollidableMesh) {
                floorMesh.push(getCollidableMesh);
            }
        }
        let xrOptions = {
            floorMeshes: floorMesh,
            inputOptions: {
                doNotLoadControllerMeshes: true
            }
        }

        xrCamera = await scene.createDefaultXRExperienceAsync(xrOptions);

        xrCamera.pointerSelection.displayLaserPointer = false;
        xrCamera.pointerSelection.displaySelectionMesh = false;

        addWebXR(scene, xrCamera, cylinders).then((handAnimations) => {
            console.log("add webxr");
            if (xrCamera) {
                const flyToCamera = new FlyToCameraBehavior(xrCamera.baseExperience);
                const clipboard = scene.getMeshByName("clipboard");
                clipboard.addBehavior(flyToCamera);        
            }
            
            let sceneManger: SceneManager = new SceneManager(scene, cylinders);
            sceneManger.postSceneCylinder();
            addXRBehaviors(scene, xrCamera, handAnimations, cylinders)

        });

    }


    createRoom(mesh: Mesh[]) {
        const wantedCollisions = [
            'WallsandFloor',
            'WallsAndFloor.001',
            'Table',
            'Roof',
            'Countertop',
            'Walls',
        ]
        let scene: Scene, camera: UniversalCamera;
        for (let getStringMesh of wantedCollisions) {
            const getCollidableMesh: Mesh = mesh.find(mesh => mesh.name === getStringMesh)!;
            if (getCollidableMesh) {
                getCollidableMesh.checkCollisions = true;
                if (getCollidableMesh.name === 'Table') {
                    const tableBoundingBox: BoundingBox = getCollidableMesh.getBoundingInfo().boundingBox;
                    const cameraXPosition = tableBoundingBox.center.x;
                    scene = getCollidableMesh.getScene();
                    camera = (scene.getCameraByName('camera') as UniversalCamera);
                    camera.position.x = cameraXPosition - 0.7;
                }
            }
        }
        //Set the speed here so we have the room loaded before the user can move around.
    }

    createScene() {
        return new Promise((finishedAllModels,) => {
            const canvas = document.getElementById('canvas') as HTMLCanvasElement
            const engine = new Engine(canvas, true, { stencil: true });
            const scene = new Scene(engine);
            // scene.debugLayer.show();
            //scene.gravity.y = -0.01
            scene.collisionsEnabled = true;
            window.addEventListener("resize", function () {
                engine.resize();
            });
            // checkIfDebug(scene);
            const camera = new UniversalCamera('camera', new Vector3(0, 1.84, -1.134), scene);
            camera.ellipsoid = new Vector3(0.4, 0.7, 0.4);
            camera.attachControl(canvas, true);
            camera.applyGravity = true;
            camera.minZ = 0.0;  // To prevent clipping through near meshes
            camera.speed = 0;
            camera.checkCollisions = true;
            camera.keysUp.push(87);  // W
            camera.keysDown.push(83);  // S
            camera.keysLeft.push(65);  // A
            camera.keysRight.push(68);  // D
            var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
            light1.intensity = 0;
            Promise.all(this.models.map((model) => {
                return new Promise((resolve,) =>
                    SceneLoader.ImportMesh('', model["root"], model.fileName, scene, function (container) {
                        model["mesh"] = container
                        resolve(container)
                    }))
            })).then(() => {
                let callbackResults = []
                this.models.map((model) => {
                    callbackResults.push(model["callback"](model["mesh"]))
                    finishedAllModels(scene);
                })
                let [a, b, c, ...d] = callbackResults

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
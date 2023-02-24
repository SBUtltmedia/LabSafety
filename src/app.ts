import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
    Engine,
    Scene,
    SceneLoader,
    Vector3,
    HemisphericLight,
    Mesh,
    Color3,
    UniversalCamera,
    WebXRDefaultExperience,
    BoundingBox,
    Light,
    WebXRControllerPointerSelection,
    Ray,
    AbstractMesh,
} from "@babylonjs/core";
import { createCylinder } from "./LoadCylinder";
import { checkIfDebug } from "./utils";
import { createClipboard } from "./LoadClipboard";
import { defaultCallBack } from "./DefaultCallback";
import { createPlacard } from "./CreatePlarcard";
import SOP from './SOP';
import { postSceneCylinder } from "./PostSceneCylinderBehavior";
import FlyToCameraBehavior from "./FlyToCameraBehavior";
import { PointerDragBehavior } from "babylonjs";


class App {
    constructor() {
        let xrCamera: WebXRDefaultExperience;
        let sop = new SOP("", "", [{ next: "CtoA", label: "BtoC" },
        { next: "complete", label: "CtoA" },
        ]);
        const models = [
            //{ "fileName": "RoomandNewLabBench.glb", "callback": mesh => createRoom(mesh), "label": "floor" },
            { "fileName": "NewLaboratoryUNFINISHED.glb", "callback": (mesh: Mesh[]) => createRoom(mesh), "label": "floor" },
            { "fileName": "TLLGraduatedCylinderWithLabel.glb", "callback": (mesh: Mesh[]) => createCylinder(mesh[0], 1, "Cylinder-A", new Color3(1, 0, 0)), "label": "Cylinder-A" },
            { "fileName": "TLLGraduatedCylinderWithLabel.glb", "callback": (mesh: Mesh[]) => createCylinder(mesh[0], 2, "Cylinder-B", new Color3(0, 1, 0)), "label": "Cylinder-B" },
            { "fileName": "TLLGraduatedCylinderWithLabel.glb", "callback": (mesh: Mesh[]) => createCylinder(mesh[0], 3, "Cylinder-C", new Color3(0, 0, 1)), "label": "Cylinder-C" },
            { "fileName": "clipBoardWithPaperCompressedTexture.glb", "callback": (mesh: Mesh[]) => createClipboard(mesh[0]) },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 1, "Placard-A") },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 2, "Placard-B") },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 3, "Placard-C") },
            // "root":"https://raw.githubusercontent.com/PatrickRyanMS/SampleModels/master/Yeti/glTF/" }
        ].map(function ({ fileName = "LabBench.glb", root = "./models/", callback = defaultCallBack, label = "NoLabel" } = {}) {
            return { fileName, callback, root, label }
        })
        createScene().then(processScene); //Can be turn back on if Z axis gets messed up

        async function processScene(scene: Scene) {
            let camera = (scene.getCameraByName('camera') as UniversalCamera);
            let light: Light = scene.getLightByName('light1');
            //light.intensity = 1;
            camera.speed = 0.16;
            let cameraFadeIn = setInterval(() => {
                if (light.intensity >= 1) {
                    clearInterval(cameraFadeIn);
                } else {
                    light.intensity += 0.10;
                }
            }, 60)
            await addWebXR(scene);
            const clipboard = scene.getMeshByName('clipboard');
            if (xrCamera) {
                const flyToCamera = new FlyToCameraBehavior(xrCamera.baseExperience);
                clipboard.addBehavior(flyToCamera);
            }
            postSceneCylinder(scene, sop);
            let cylinder;
            let gotSomething: PointerDragBehavior;
            xrCamera.input.onControllerAddedObservable.add(controller => {
                controller.onMotionControllerInitObservable.add(motionController => {
                    const ray = new Ray(Vector3.Zero(), Vector3.Zero(), 0.25);
                    const squeezeComponent = motionController.getComponentOfType('squeeze')!;
                    squeezeComponent.onButtonStateChangedObservable.add(() => {
                        const controllerMesh = motionController.rootMesh;
                        if (squeezeComponent.pressed) {
                            controller.getWorldPointerRayToRef(ray, true);
                            console.log("HEY SHOULD PICK UP");
                            ray.length = 0.25;
                            let pickingInfo = scene.pickWithRay(ray);
                            if (pickingInfo.hit && pickingInfo.pickedMesh.name.includes('pivot-Cylinder')) {
                                cylinder = scene.getMeshByName(pickingInfo.pickedMesh.name);
                                gotSomething = cylinder.getBehaviorByName('PointerDrag');
                                if (!gotSomething.dragging) {
                                    console.log("starting the drag");
                                    gotSomething.startDrag();
                                    //console.log(gotSomething.currentDraggingPointerId);
                                }
                            }
                        } else {
                            if (cylinder && gotSomething.dragging) {
                                gotSomething.releaseDrag();
                                cylinder = null;
                                gotSomething = null;
                            }
                        }
                    })
                })
            })
        }
        async function addWebXR(scene: Scene) {
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
                floorMeshes: floorMesh
            }
            xrCamera = await scene.createDefaultXRExperienceAsync(xrOptions);
            xrCamera.pointerSelection.detach();
            // const controllerFeature = xrCamera.baseExperience.featuresManager.enableFeature(WebXRControllerPointerSelection.Name, "latest")
            // controllerFeature.displayLaserPointer = false;
            // console.log(xrCamera.baseExperience.featuresManager.);
            //enableXRGrab(xr.input);
        }
        function createRoom(mesh: Mesh[]) {
            //Allows us to turn on and off what meshes to add collision to
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

        function createScene() {
            return new Promise((finishedAllModels,) => {
                var canvas = document.getElementById('canvas') as HTMLCanvasElement
                var engine = new Engine(canvas, true, { stencil: true });
                var scene = new Scene(engine);
                //scene.gravity.y = -0.01
                scene.collisionsEnabled = true;
                window.addEventListener("resize", function () {
                    engine.resize();
                });
                checkIfDebug(scene);
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
                Promise.all(models.map((model) => {
                    return new Promise((resolve,) =>
                        SceneLoader.ImportMesh('', model["root"], model.fileName, scene, function (container) {
                            model["mesh"] = container
                            resolve(container)
                        }))
                })).then(() => {
                    models.map((model) => {
                        //console.log(model)
                        model["callback"](model["mesh"])
                        finishedAllModels(scene);
                    })

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
}
new App();
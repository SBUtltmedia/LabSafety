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
    AbstractMesh,
    WebXRDefaultExperience,
    PointerDragBehavior,
    Nullable,
} from "@babylonjs/core";
import { createCylinder } from "./LoadCylinder";
import { checkIfDebug, getChildMeshByName } from "./utils";
import { createClipboard } from "./LoadClipboard";
import { defaultCallBack } from "./DefaultCallback";
import { createPlacard } from "./CreatePlarcard";
import HighlightBehavior from "./HighlightBehavior";
import { CYLINDER_MESH_NAME } from "./Constants";
import SOP from './SOP';

class App {
    constructor() {
        let xrCamera: WebXRDefaultExperience;
        let sop = new SOP("", "", [{ next: "CtoA", label: "BtoC" },
        { next: "complete", label: "CtoA" },
        ]);
        const models = [
            //{ "fileName": "RoomandNewLabBench.glb", "callback": mesh => createRoom(mesh), "label": "floor" },
            { "fileName": "NewLaboratoryUNFINISHED.glb", "callback": (mesh: Mesh[]) => createRoom(mesh), "label": "floor" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": (mesh: Mesh[]) => createCylinder(mesh[0], 1, "Cylinder-A", new Color3(1, 0, 0)), "label": "Cylinder-A" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": (mesh: Mesh[]) => createCylinder(mesh[0], 2, "Cylinder-B", new Color3(0, 1, 0)), "label": "Cylinder-B" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": (mesh: Mesh[]) => createCylinder(mesh[0], 3, "Cylinder-C", new Color3(0, 0, 1)), "label": "Cylinder-C" },
            { "fileName": "clipBoardWithPaperCompressedTexture.glb", "callback": (mesh: Mesh[]) => createClipboard(mesh[0], xrCamera) },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 1, "Placard-A") },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 2, "Placard-B") },
            { "fileName": "Placard_Label.glb", 'callback': (mesh: Mesh[]) => createPlacard(mesh, 3, "Placard-C") },
            // "root":"https://raw.githubusercontent.com/PatrickRyanMS/SampleModels/master/Yeti/glTF/" }
        ].map(function ({ fileName = "LabBench.glb", root = "./models/", callback = defaultCallBack, label = "NoLabel" } = {}) {
            return { fileName, callback, root, label }
        })
        createScene().then(processScene); //Can be turn back on if Z axis gets messed up

        function processScene(scene: Scene) {
            scene.onBeforeRenderObservable.add(function () {
                let cylinderLetters = ['A', 'B', 'C'];
                for (let i = 0; i < cylinderLetters.length; i++) {
                    const cylinder = scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);
                    const table: AbstractMesh = scene.getMeshByName('Table')!;
                    if (table && cylinder) {
                        const tableBoundingBox = table.getBoundingInfo().boundingBox;
                        cylinder.position.z = (tableBoundingBox.centerWorld.z + tableBoundingBox.minimumWorld.z) / 2;
                    }
                }
            });
            let cylinderLetters: Array<string> = ['A', 'B', 'C'];
            let allCylinders = [];
            for (let char of cylinderLetters) {
                const cylinder = scene.getMeshByName(`pivot-Cylinder-${char}`);
                allCylinders.push((cylinder as Mesh));
            }
            for (let i = 0; i < cylinderLetters.length; i++) {
                const cylinder = scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);
                const gotSomething = cylinder.getBehaviorByName('PointerDrag');
                let filteredMeshes = [];
                for (let cylMesh of allCylinders) {
                    if (cylMesh != cylinder) {
                        filteredMeshes.push(cylMesh);
                    }
                }
                //TODO: FIX THIS PROBLEM! IT DETECTS TOO EARLY
                let sourceCylinder = getChildMeshByName(cylinder, CYLINDER_MESH_NAME);
                (gotSomething as PointerDragBehavior).onDragObservable.add((eventData) => {
                    const highlightingTheDrag = getChildMeshByName(cylinder, CYLINDER_MESH_NAME).getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
                    for (let singleMesh of filteredMeshes) {
                        let leftCollision = getChildMeshByName(singleMesh, 'LEFT_COLLISION');
                        let rightCollision = getChildMeshByName(singleMesh, 'RIGHT_COLLISION');
                        let targetCylinder = getChildMeshByName(singleMesh, CYLINDER_MESH_NAME);
                        if (sourceCylinder.intersectsMesh(leftCollision) || sourceCylinder.intersectsMesh(rightCollision)) {
                            let to = singleMesh.name.split('-')[2];
                            let from = cylinder.name.split('-')[2];
                            let fromAndTo = `${from}to${to}`
                            console.log(sop.tasks[sop.currentState].label, fromAndTo);
                            if (sop.tasks[sop.currentState].label === fromAndTo) {
                                if (sop.tasks[sop.currentState].next === 'complete') {
                                    console.log("done!");
                                    window.location = '.';
                                } else {
                                    sop.currentState = sop.tasks.indexOf(sop.tasks.find((value, index) => value.label == sop.tasks[sop.currentState].next));
                                }
                            }
                            if (highlightingTheDrag) {
                                highlightingTheDrag.highlightMesh((sourceCylinder as Mesh));
                                highlightingTheDrag.highlightMesh((targetCylinder as Mesh));
                                sourceCylinder.rotation.z = 4.6146505;
                                if (sourceCylinder.intersectsMesh(leftCollision)) {
                                    targetCylinder.rotation.y = Math.PI;
                                    sourceCylinder.rotation.y = 0;
                                } else {
                                    targetCylinder.rotation.y = 0;
                                    sourceCylinder.rotation.y = Math.PI;
                                }
                            }
                            break;
                        } else {
                            highlightingTheDrag.unhighlightMesh((sourceCylinder as Mesh));
                            highlightingTheDrag.unhighlightMesh((targetCylinder as Mesh));
                            sourceCylinder.rotation.z = Math.PI * 2;
                        }
                    }
                });
                (gotSomething as PointerDragBehavior).onDragEndObservable.add((eventData) => {
                    const highlightingTheDrag = getChildMeshByName(cylinder, CYLINDER_MESH_NAME).getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
                    for (let singleMesh of filteredMeshes) {
                        let leftCollision = getChildMeshByName(singleMesh, 'LEFT_COLLISION');
                        let rightCollision = getChildMeshByName(singleMesh, 'RIGHT_COLLISION');
                        let targetCylinder = getChildMeshByName(singleMesh, CYLINDER_MESH_NAME);
                        if (sourceCylinder.intersectsMesh(leftCollision) || sourceCylinder.intersectsMesh(rightCollision)) {
                            if (highlightingTheDrag) {
                                highlightingTheDrag.unhighlightMesh((sourceCylinder as Mesh));
                                highlightingTheDrag.unhighlightMesh((targetCylinder as Mesh));
                            }
                            sourceCylinder.rotation.z = Math.PI * 2;
                        }
                    }
                })
            }
        }
        async function addWebXR(scene: Scene) {
            const wantedCollisions = [
                'WallsandFloor',
                'WallsAndFloor.001',
                'Countertop',
            ]
            let xrOptions = {};
            for (let getStringMesh of wantedCollisions) {
                const getCollidableMesh: Mesh = scene.getMeshByName(getStringMesh) as Mesh;
                if (getCollidableMesh) {
                    xrOptions = {
                        floorMeshes: [getCollidableMesh],
                        ignoreNativeCameraTransformation: true
                    };
                }
            }
            xrCamera = await scene.createDefaultXRExperienceAsync(xrOptions);
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
            for (let getStringMesh of wantedCollisions) {
                const getCollidableMesh: Mesh = mesh.find(mesh => mesh.name === getStringMesh)!;
                if (getCollidableMesh) {
                    getCollidableMesh.checkCollisions = true;
                    if (getCollidableMesh.name === 'Table') {
                        //Todo: change the camera position here so it's in front of the table :D
                    }
                }
            }

        }

        function createScene() {
            return new Promise((finishedAllModels,) => {
                var canvas = document.getElementById('canvas') as HTMLCanvasElement
                var engine = new Engine(canvas, true, { stencil: true });
                var scene = new Scene(engine);
                scene.collisionsEnabled = true;
                window.addEventListener("resize", function () {
                    engine.resize();
                });
                checkIfDebug(scene);
                const camera = new UniversalCamera('camera', new Vector3(1.088, 1.84, -1.134), scene);
                camera.ellipsoid = new Vector3(0.4, 0.7, 0.4);
                camera.attachControl(canvas, true);
                camera.applyGravity = true;
                camera.minZ = 0;  // To prevent clipping through near meshes
                camera.speed = 0.16;
                camera.checkCollisions = true;
                camera.keysUp.push(87);  // W
                camera.keysDown.push(83);  // S
                camera.keysLeft.push(65);  // A
                camera.keysRight.push(68);  // D
                addWebXR(scene);
                var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
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
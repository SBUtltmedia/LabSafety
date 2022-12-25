import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
    Engine,
    Scene,
    BoundingBoxGizmo,
    SceneLoader,
    Vector3,
    HemisphericLight,
    Mesh,
    Color3,
    UniversalCamera,
    AbstractMesh,
} from "@babylonjs/core";
import { createCylinder } from "./loadCylinder";
import { checkIfDebug } from "./utils";
import { createClipboard } from "./loadClipboard";

class App {
    constructor() {
        const models = [
            // { "fileName": "LabBench.glb", "callback": console.log },
            // {
            //     "fileName": "Laboratory.glb", "callback": result => {


            //     }
            // },
            // { "fileName": "Placard_Label.glb" },
            //{ "fileName": "RoomandNewLabBench.glb", "callback": mesh => createRoom(mesh), "label": "floor" },
            { "fileName": "NewLaboratoryUNFINISHED.glb", "callback": mesh => createRoom(mesh), "label": "floor" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": mesh => createCylinder(mesh[0], 1, "Cylinder-A", new Color3(1, 0, 0)), "label": "Cylinder-A" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": mesh => createCylinder(mesh[0], 2, "Cylinder-B", new Color3(0, 1, 0)), "label": "Cylinder-B" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": mesh => createCylinder(mesh[0], 3, "Cylinder-C", new Color3(0, 0, 1)), "label": "Cylinder-C" },
            { "fileName": "clipBoardWithPaperCompressedTexture.glb", "callback": mesh => createClipboard(mesh[0]) },
            //{ "fileName": ""}

            // "root":"https://raw.githubusercontent.com/PatrickRyanMS/SampleModels/master/Yeti/glTF/" }
        ].map(function ({ fileName = "LabBench.glb", root = "./models/", callback = defaultCallBack, label = "NoLabel" } = {}) {

            return { fileName, callback, root, label }
        })
        createScene().then(processScene); //Can be turn back on if Z axis gets messed up

        function processScene(scene: Scene) {
            scene.onBeforeRenderObservable.add(function () {
                let cylinderLetters = ['A', 'B', 'C'];
                for (var i = 0; i < cylinderLetters.length; i++) {
                    let cylinder = scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);
                    const table: AbstractMesh = scene.getMeshByName('Table');
                    const tableBoundingBox = table.getBoundingInfo().boundingBox;
                    //cylinder.position.z = 0.5;
                    cylinder.position.z = (tableBoundingBox.centerWorld.z + tableBoundingBox.minimumWorld.z) / 2;
                }
            });
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
            const xr = await scene.createDefaultXRExperienceAsync(xrOptions);
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
                const getCollidableMesh: Mesh = mesh.find(mesh => mesh.name === getStringMesh);
                if (getCollidableMesh) {
                    getCollidableMesh.checkCollisions = true;
                }

            }

        }


        function defaultCallBack(result) {
            var gizmo = new BoundingBoxGizmo(Color3.FromHexString("#0984e3"))
            gizmo.ignoreChildren = true;
            var gltfMesh = result[0]
            var bb = BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(gltfMesh)

            gizmo.attachedMesh = bb;

            gizmo.onScaleBoxDragObservable.add(() => {
                console.log("scaleDrag")
            });
            gizmo.onScaleBoxDragEndObservable.add(() => {
                const attachedMesh = gizmo.attachedMesh;
                if (attachedMesh) {
                    const bounds = attachedMesh.getHierarchyBoundingVectors(true);
                    console.log('size x:', bounds.max.x - bounds.min.x);
                    console.log('size y:', bounds.max.y - bounds.min.y);
                    console.log('size z:', bounds.max.z - bounds.min.z);

                }
                console.log("scaleEnd")
            });
            gizmo.onRotationSphereDragObservable.add(() => {
                console.log("rotDrag")
            });
            gizmo.onRotationSphereDragEndObservable.add(() => {
                console.log("rotEnd")
            });

            //});
        }


        function createScene() {
            return new Promise((finishedAllModels, reject2) => {
                var canvas = document.getElementById('canvas') as HTMLCanvasElement
                var engine = new Engine(canvas, true, { stencil: true });
                var scene = new Scene(engine);
                scene.collisionsEnabled = true;
                window.addEventListener("resize", function () {
                    engine.resize();
                });
                checkIfDebug(scene);
                const camera = new UniversalCamera('camera', new Vector3(1.088, 1.82, -1.134), scene);
                camera.ellipsoid = new Vector3(0.4, 0.7, 0.4);
                camera.attachControl(canvas, true);
                camera.applyGravity = true;
                camera.minZ = 0;  // To prevent clipping through near meshes
                camera.speed = 0.2;
                camera.checkCollisions = true;
                camera.keysUp.push(87);  // W
                camera.keysDown.push(83);  // S
                camera.keysLeft.push(65);  // A
                camera.keysRight.push(68);  // D
                addWebXR(scene);
                // let customGround: Mesh = MeshBuilder.CreateBox("ground", { width: 9, height: 0.01, depth: 5 }, scene);
                // customGround.position.y = 0.4
                // customGround.checkCollisions = true;
                // customGround.showBoundingBox = true;
                var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
                //scene.debugLayer.show();

                Promise.all(models.map((model) => {
                    return new Promise((resolve, reject) =>
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
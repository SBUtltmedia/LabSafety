import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
    Engine,
    Scene,
    BoundingBoxGizmo,
    SceneLoader,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    Mesh,
    Color3,
    MeshBuilder,
    PointerDragBehavior,
    UniversalCamera,
    StandardMaterial,
    AbstractMesh,
    Nullable
} from "@babylonjs/core";

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
            //{ "fileName": "NewLaboratoryUNFINISHED.glb", "callback": mesh => createRoom(mesh), "label": "floor" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": mesh => createCylinder(mesh[0], 3, "Cylinder-A", new Color3(1, 0, 0)), "label": "Cylinder-A" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": mesh => createCylinder(mesh[0], 2, "Cylinder-B", new Color3(0, 1, 0)), "label": "Cylinder-B" },
            { "fileName": "TLLGraduatedCylinder.glb", "callback": mesh => createCylinder(mesh[0], 1, "Cylinder-C", new Color3(0, 0, 1)), "label": "Cylinder-C" },
            //  { "fileName": "clipboard.glb" }
            // { "fileName": "fireAlarm.glb" },
            // { "fileName": "Yeti_IdleUnity.gltf",
            // "root":"https://raw.githubusercontent.com/PatrickRyanMS/SampleModels/master/Yeti/glTF/" }
        ].map(function ({ fileName = "LabBench.glb", root = "./models/", callback = defaultCallBack, label = "NoLabel" } = {}) {

            return { fileName, callback, root, label }
        })
        createScene().then(processScene);

        function processScene(scene: Scene) {
            scene.onBeforeRenderObservable.add(function () {
                let cylinderLetters = ['A', 'B', 'C'];
                for (var i = 0; i < cylinderLetters.length; i++) {

                    let cylinder = scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);

                    //cylinder.position.z = 0;
                }
            });
        }

        //? We might wanna add the ability to change it based off rotation
        function createCylinder(cylinderMesh: Mesh, i: number, name: string, color: Color3) {
            let beakerMesh = getChildMeshByName(cylinderMesh as AbstractMesh, 'BeakerwOpacity')!;
            console.log(beakerMesh);
            let beakerBounding = beakerMesh.getBoundingInfo().boundingBox;
            let beakerWidth = beakerBounding.maximum.z - beakerBounding.minimum.z;
            let beakerHeight = beakerBounding.maximum.y - beakerBounding.minimum.y;
            let beakerDepth = beakerBounding.maximum.x - beakerBounding.minimum.x;
            let base: Mesh = MeshBuilder.CreateBox(`pivot-${name}`, { size: 1, height: beakerHeight, width: beakerWidth, depth: beakerDepth }, cylinderMesh.getScene());
            base.visibility = 100;
            cylinderMesh.name = name;
            cylinderMesh.parent = base;
            // cylinderMesh.scaling.scaleInPlace(2);
            // base.scaling.scaleInPlace(0.5);
            base.position.x = 1 * i;
            base.position.y = 0;
            base.checkCollisions = true;
            //TODO: ELIPSOID
            base.ellipsoid = new Vector3(beakerWidth, beakerHeight, beakerDepth);
            const cylinderLiquid: AbstractMesh = getChildMeshByName(cylinderMesh as AbstractMesh, 'BeakerLiquid')!;
            const cylinderLiquidMaterial = new StandardMaterial('liquid-material');
            cylinderLiquidMaterial.diffuseColor = color;
            cylinderLiquid.material = cylinderLiquidMaterial;
            addDragCollision(base);
        }

        function getChildMeshByName(mesh: AbstractMesh, name: string): Nullable<AbstractMesh> {
            return mesh.getChildMeshes().find(mesh => mesh.name === name) || null;
        }

        function addDragCollision(mesh: Mesh) {
            let pointerDragBehaviors = new PointerDragBehavior({
                dragPlaneNormal: new Vector3(0, 0, 1),
            });

            pointerDragBehaviors.moveAttached = false
            pointerDragBehaviors.onDragObservable.add((eventData) => {
                eventData.delta.z = 0;
                mesh.moveWithCollisions(eventData.delta)
            })
            mesh.addBehavior(pointerDragBehaviors)
        }


        function createRoom(mesh: Mesh[]) {
            //const table = mesh.find(mesh => mesh.name === 'Table')!;
            const rootThing = mesh.find(mesh => mesh.name === 'WallsandFloor')!;
            const table = mesh.find(mesh => mesh.name === 'Table')!;
            rootThing.checkCollisions = true;
            table.checkCollisions = true;
            //console.log(rootThing.getBoundingInfo().boundingBox.minimum.y);
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

        function checkIfDebug(scene: Scene) {
            const searchParams = new URLSearchParams(document.location.search);
            let debug = searchParams.get('debug') === '' || searchParams.get('debug')?.toLowerCase() === 'true';
            if (debug) {
                scene.debugLayer.show();
            }
        }

        function createScene() {
            return new Promise((resolve2, reject2) => {
                var canvas = document.getElementById('canvas') as HTMLCanvasElement
                var engine = new Engine(canvas, true, { stencil: true });
                var scene = new Scene(engine);
                scene.collisionsEnabled = true;
                window.addEventListener("resize", function () {
                    engine.resize();
                });


                checkIfDebug(scene);
                const camera = new UniversalCamera('camera', new Vector3(1.088, 1.8, -1.134), scene);
                camera.ellipsoid = new Vector3(0.4, 0.6, 0.4);
                camera.attachControl(canvas, true);
                //camera.applyGravity = true;
                camera.minZ = 0;  // To prevent clipping through near meshes
                camera.speed = 0.2;
                camera.checkCollisions = true;
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
                            resolve2(scene);
                        }))
                })).then(() => {
                    models.map((model) => {
                        //console.log(model)
                        model["callback"](model["mesh"])

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
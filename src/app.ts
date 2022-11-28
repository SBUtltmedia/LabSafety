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
    MeshBuilder
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
            { "fileName": "TLLGraduatedCylinder.glb" },
            //  { "fileName": "clipboard.glb" }
            // { "fileName": "fireAlarm.glb" },
            // { "fileName": "Yeti_IdleUnity.gltf",
            // "root":"https://raw.githubusercontent.com/PatrickRyanMS/SampleModels/master/Yeti/glTF/" }
        ].map(function ({ fileName = "LabBench.glb", root="./models/",callback = defaultCallBack} = {}){

            return { fileName, callback,root }
        })
        function defaultCallBack(result){
            console.log(result)
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
   
   
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);


        Promise.all(models.map((model) => {
            return new Promise((resolve, reject) => 
             SceneLoader.ImportMesh('',model["root"], model.fileName, scene, function (container) {
                model["mesh"]=container
                resolve(container)
              
            }))
    
        })).then(() => {
            models.map((model) => { 
                console.log(model)
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
    }
}
new App();
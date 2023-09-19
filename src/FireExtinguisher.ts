import { AbstractMesh, Observer, Mesh, Animation, PointerDragBehavior, Scene, TransformNode, Vector3, WebXRDefaultExperience, PointerEventTypes, PointerInfo } from "@babylonjs/core";
import { TIME_UNTIL_FADE, sop } from "./Constants";
import { SmokeParticles } from "./SmokeParticles";
import { FireCabinet } from "./FireCabinet";
import { log } from "./utils";

export class FireExtinguisher {
    modelTransform: TransformNode
    scene: Scene
    mesh: Mesh
    base: Mesh
    startPos: Vector3 = new Vector3(3.8, 1.505, -2.46);
    // startPos: Vector3 = new Vector3(0,1,0)

    smokeSystem: SmokeParticles
    fireCabinetInstance: FireCabinet
    fireExtinguished: boolean = false
    pointerDragBehav: PointerDragBehavior
    xrCamera: WebXRDefaultExperience
    onPointerDownObserver: Observer<PointerInfo>;
    childMeshes: AbstractMesh[]

    isHolding = false;
    isRunning = false;

    constructor() {

    }

    setModel(model: Mesh) {
        this.mesh = model;
        this.scene = model.getScene();
        this.modelTransform = this.scene.getTransformNodeByName("fire_ex");

        this.mesh.position = this.startPos;
        this.mesh.isPickable = true;

        log(this.mesh);

        this.smokeSystem = new SmokeParticles(this.mesh);

        this.stopSmoke();
        this.childMeshes = this.getChildMeshes(this.mesh);

        this.onPointerDownObserver = this.scene.onPointerObservable.add(
            this.flyToCamera
        );
        // this.startSmoke();
    }

    getChildMeshes(mesh: Mesh) {
        let childMeshes: Mesh[];
        childMeshes = mesh.getChildMeshes();

        let subChildMeshes = [];

        function dfs(mesh: AbstractMesh) {
            for (let childMesh of mesh.getChildMeshes()) {
                subChildMeshes.push(childMesh);
                dfs(childMesh);
            }
        }

        for (let mesh of childMeshes) {
            subChildMeshes = [mesh];
            dfs(mesh);
            childMeshes.concat(subChildMeshes);
        }

        return childMeshes;
    }    

    flyToCamera = (
        pointerInfo = {
            type: PointerEventTypes.POINTERDOWN,
            pickInfo: { pickedMesh: this.mesh },
        }
    ) => {
        
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN && !this.isHolding) {
            const pickedMesh = pointerInfo.pickInfo?.pickedMesh;
            console.log(this.isHolding);
            if (pickedMesh.isDescendantOf(this.mesh)) {
                log("CLICKCKCKC");
                this.isHolding = true;
                console.log(this.scene);
                let camera = this.scene.activeCamera;
                this.mesh.position = camera.position;
                this.mesh.parent = camera;

                this.mesh.rotation = new Vector3(0,120 * Math.PI / 180,0);

                this.mesh.position.x = 0.4;
                this.mesh.position.y = -0.4;
                this.mesh.position.z = 1.1;
            }
        } else if (pointerInfo.type === PointerEventTypes.POINTERDOWN && this.isHolding) {
            if (!this.isRunning) {
                this.startSmoke();
                this.isRunning = true;
            }
        } else {
            if (this.isRunning) {
                this.stopSmoke();
                this.isRunning = false;
            }
        }
    }


    startSmoke() {
        this.smokeSystem.start();
    }

    stopSmoke() {
        this.smokeSystem.stop();
    }
}
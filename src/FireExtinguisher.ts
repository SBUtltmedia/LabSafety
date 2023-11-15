import { AbstractMesh, Observer, Mesh, Animation, PointerDragBehavior, Scene, TransformNode, Vector3, WebXRDefaultExperience, PointerEventTypes, PointerInfo, WebXRState } from "@babylonjs/core";
import { TIME_UNTIL_FADE, sop } from "./Constants";
import { SmokeParticles } from "./SmokeParticles";
import { FireCabinet } from "./FireCabinet";
import { log } from "./utils";
import { Fire } from "./Fire";
import { SmokeBehavior } from "./SmokeBehavior";

export class FireExtinguisher {
    modelTransform: TransformNode
    scene: Scene
    mesh: Mesh
    base: Mesh
    startPos: Vector3 = new Vector3(3.8, 1.75, -2.5);
    rotation: Vector3;
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
    xrHolding = false;

    extinguished = false;

    fire: Fire;

    constructor() {

    }

    setModel(model: Mesh) {
        this.mesh = model;
        this.scene = model.getScene();
        this.modelTransform = this.scene.getTransformNodeByName("fire_ex");

        this.mesh.position = this.startPos;
        this.mesh.isPickable = true;

        this.rotation = Object.assign({}, this.mesh.rotation);

        this.extinguished = false;

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
                this.isHolding = true;
                let camera = this.scene.activeCamera;

                if (this.xrCamera.baseExperience.state === WebXRState.IN_XR) {
                    console.log("In XR");
                } else {    
                    console.log(this.scene);
                    this.mesh.parent = camera;
                    
                    this.mesh.position.x = 0.4;
                    this.mesh.position.y = -0.1;
                    this.mesh.position.z = 1.1;

                    this.mesh.rotation = new Vector3(0, Math.PI, 0);

                }

                this.mesh.addBehavior(new SmokeBehavior);
            }
        }
    }


    startSmoke() {
        this.smokeSystem.start();
    }

    stopSmoke() {
        this.smokeSystem.stop();
    }

    reset() {

        this.isHolding = false;
        this.isRunning = false;
        this.xrHolding = false;

        this.mesh.isPickable = true;

        this.extinguished = false;

        this.stopSmoke();

        this.mesh.parent = null;

        setTimeout(() => {
            this.mesh.position = this.startPos;
            this.mesh.rotation = this.rotation;
        }, 300);

        if (this.fire)
            this.fire.hide();
    }
}
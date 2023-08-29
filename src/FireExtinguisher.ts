import { AbstractMesh, Mesh, Animation, PointerDragBehavior, Scene, TransformNode, Vector3, WebXRDefaultExperience } from "@babylonjs/core";
import { TIME_UNTIL_FADE, sop } from "./Constants";
import { SmokeParticles } from "./SmokeParticles";
import { FireCabinet } from "./FireCabinet";

export class FireExtinguisher {
    modelTransform: TransformNode
    scene: Scene
    mesh: Mesh
    base: Mesh
    startPos: Vector3 = new Vector3(1.89, 1, -0.95)
    // startPos: Vector3 = new Vector3(0,1,0)

    smokeSystem: SmokeParticles
    fireCabinetInstance: FireCabinet
    fireExtinguished: boolean = false
    pointerDragBehav: PointerDragBehavior
    xrCamera: WebXRDefaultExperience

    constructor() {

    }

    setModel(model: Mesh) {
        this.mesh = model;
        this.scene = model.getScene();
        this.modelTransform = this.scene.getTransformNodeByName("fire_ex");

        this.mesh.position = this.startPos;
        this.mesh.isPickable = true;

        console.log(this.mesh);

        this.addDragBehavior();

        let meshes = this.getChildMeshes(this.mesh);

        this.smokeSystem = new SmokeParticles(this.mesh);

        this.stopSmoke();
        // this.startSmoke();
    }

    // need to do a depth-first-search to get all the child meshes and grandchild meshes...
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

    addDragBehavior() {
        let pointerDragBehavior = new PointerDragBehavior({
            dragPlaneNormal: new Vector3(0, 1, 0), //What limits our axis
        });
        pointerDragBehavior.useObjectOrientationForDragging = false;

        let timeout, releaseTimeout;

        pointerDragBehavior.onDragStartObservable.add(() => {
            console.log("Start!");
            // if its closed then drop: true = closed, false = open
            if (!this.fireCabinetInstance.state) {
                let camera = this.scene.activeCamera;
                setTimeout(() => {
                    //@ts-ignore
                    camera.rotation.y *= -1;
                    this.xrCamera.baseExperience.camera.rotation.y *= -1;
                }, 500);
                timeout = setTimeout(() => {
                    //@ts-ignore
                    this.startSmoke();
                }, 1000);
            }
        })

        pointerDragBehavior.onDragObservable.add(() => {
            let wallsAndFloor = this.scene.getMeshByName("WallsandFloor");

            console.log(this.fireCabinetInstance.state);

            // if the extinguisher is inside the room, it intersects WallsAndFloor
            if (this.fireCabinetInstance.state && this.mesh.intersectsMesh(wallsAndFloor) && this.mesh.isPickable) {
                pointerDragBehavior.releaseDrag();
            }

            if (sop.failed) {
                releaseTimeout = setTimeout(() => {
                    this.scene.getMeshByName("fireplane").isVisible = false;
                    this.fireExtinguished = true;                    
                    pointerDragBehavior.releaseDrag();
                }, 5000);
            }
        });

        pointerDragBehavior.onDragEndObservable.add(() => {
            if (timeout) {
                clearTimeout(timeout);
            }
            this.stopSmoke();
            
            this.mesh.position.x = 1.89
            this.mesh.position.y = 1;
            this.mesh.position.z = -0.95
        })

        this.mesh.addBehavior(pointerDragBehavior);
        this.pointerDragBehav = pointerDragBehavior;
    }

    startSmoke() {
        this.smokeSystem.start();
    }

    stopSmoke() {
        this.smokeSystem.stop();
    }
}
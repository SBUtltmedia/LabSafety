import { AbstractMesh, Mesh, MeshBuilder,Animation, PointerDragBehavior, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { TIME_UNTIL_FADE } from "./Constants";

export class FireExtinguisher {
    modelTransform: TransformNode
    scene: Scene
    mesh: Mesh
    base: Mesh
    startPos: Vector3 = new Vector3(1.89, 1, -0.95)

    constructor(model: Mesh) {
        this.mesh = model;
        this.scene = model.getScene();
        this.modelTransform = this.scene.getTransformNodeByName("fire_ex");

        this.mesh.position = this.startPos;
        this.mesh.isPickable = true;


        console.log(this.mesh);

        this.addDragBehavior();

        let meshes = this.getChildMeshes(this.mesh);
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

        pointerDragBehavior.onDragObservable.add(() => {
            let wallsAndFloor = this.scene.getMeshByName("WallsandFloor");

            // if the extinguisher is inside the room, it intersects WallsAndFloor
            if (!this.mesh.intersectsMesh(wallsAndFloor) && this.mesh.isPickable) {
                pointerDragBehavior.releaseDrag();
            }
        });

        pointerDragBehavior.onDragEndObservable.add(() => {
            this.fadeAndRespawn();
        })

        this.mesh.addBehavior(pointerDragBehavior);
    }

    fadeAndRespawn() {
        this.mesh.isPickable = false;

        setTimeout(() => {
            let meshes = this.getChildMeshes(this.mesh);
            let animations = [
                {name: "Invisible", startValue: 1},
                {name: "Visible", startValue: 0}
            ];

            animations.forEach((animation) => {
                animation["props"] = new Animation(
                    animation.name,
                    "visibility",
                    60,
                    Animation.ANIMATIONTYPE_FLOAT,
                    Animation.ANIMATIONLOOPMODE_CONSTANT
                );
                animation["props"].setKeys([
                    {frame: 0, value: animation.startValue},
                    {frame: 60, value: animation.startValue === 0 ? 1 : 0}
                ]);
            });

            for (let i = 0; i < meshes.length - 1; i++) {
                let mesh = meshes[i];
                this.scene.beginDirectAnimation(
                    mesh,
                    [animations[0]["props"]],
                    0,
                    60,
                    false
                )
            }

            this.scene.beginDirectAnimation(
                meshes[meshes.length - 1],
                [animations[0]["props"]],
                0,
                60,
                false,
                undefined,
                () => {

                    this.mesh.position.x = 1.89
                    this.mesh.position.y = 1;
                    this.mesh.position.z = -0.95
                    
                    for (let i = 0; i < meshes.length - 1; i++) {
                        this.scene.beginDirectAnimation(
                            meshes[i],
                            [animations[1]["props"]],
                            0,
                            60,
                            false
                        );
                    }

                    this.scene.beginDirectAnimation(
                        meshes[meshes.length - 1],
                        [animations[1]["props"]],
                        0,
                        60,
                        false,
                        undefined,
                        () => {
                            this.mesh.isPickable = true;
                        }
                    )
                }
            )

        }, TIME_UNTIL_FADE);

    }
}
import {
    Camera,
    Mesh,
    MeshBuilder,
    Scene,
    Vector3,
    Animation,
    Observer,
    PointerInfo,
    PointerEventTypes,
    Matrix,
    VertexBuffer,
    AbstractMesh,
} from "@babylonjs/core";

export class FireCabinet {
    doorMesh: AbstractMesh;
    scene: Scene;
    onPointerDownObserver: Observer<PointerInfo>;
    animations: Animation[];
    animating: boolean;
    state: boolean; // true = closed, false = opened

    constructor(cabinetMeshes: Mesh[]) {
        // this.doorMesh = MeshBuilder.CreateBox("firedoor", {
        //     size: 0.2,
        //     width: 0.05,
        // });

        console.log(cabinetMeshes[0]);

        this.scene = cabinetMeshes[0].getScene();

        console.log(this.scene);

        let cabinet = cabinetMeshes.find((curMesh) => curMesh.name === "Cabinet");

        this.doorMesh = cabinetMeshes.find((curMesh) => 
            curMesh.name === "Door"
        );

        this.doorMesh.rotationQuaternion = null

        let camera: Camera = this.scene.activeCamera;

        // cabinetMeshes[0].position = camera.position.add(new Vector3(0, -0.5, 1.75));
        
        this.doorMesh.rotation.y = Math.PI / 2;

        // // let hingeMesh = MeshBuilder.CreateBox("hinge", {
        // //     width: 0.05,
        // //     height: 0.2,
        // //     depth: 0.05,
        // // });
        // let hingeMesh = scene.getMeshByName("")
        // hingeMesh.position = camera.position.add(new Vector3(0, -0.5, 1.75));

        // this.doorMesh.setParent(hingeMesh);

        // change the center of the box to its side
        // var vertices = this.doorMesh.getVerticesData(VertexBuffer.PositionKind);
        // var vertexCount = vertices.length / 3;

        // for (var i = 0; i < vertexCount; i++) {
        //     var vertexIndex = i * 3;
        //     vertices[vertexIndex + 2] -= 0.1; // Shift x-coordinate
        // }

        // this.doorMesh.setVerticesData(VertexBuffer.PositionKind, vertices);

        this.animations = [];

        let rotationAnimation = new Animation(
            `rotateAroundY`,
            "rotation.y",
            60,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        let keyFrames = [];

        keyFrames.push({
            frame: 0,
            value: Math.PI / 2,
        });
        keyFrames.push({
            frame: 60,
            value: 0,
        });

        this.doorMesh.animations.push(rotationAnimation);
        rotationAnimation.setKeys(keyFrames);
        this.animations.push(rotationAnimation);

        let resetAnimation = new Animation(
            `resetAroundY`,
            "rotation.y",
            60,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        keyFrames = [];

        keyFrames.push({
            frame: 0,
            value: 0,
        });
        keyFrames.push({
            frame: 60,
            value: Math.PI / 2,
        });

        this.doorMesh.animations.push(resetAnimation);
        resetAnimation.setKeys(keyFrames);
        this.animations.push(resetAnimation);

        // @ts-ignore
        this.onPointerDownObserver = this.scene.onPointerObservable.add(
            this.rotateAroundY
        );

        this.animating = false;
        this.state = true;
    }

    rotateAroundY = (
        pointerInfo = {
            type: PointerEventTypes.POINTERDOWN,
            pickInfo: { pickedMesh: this.doorMesh },
        }
    ) => {
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
            const pickedMesh = pointerInfo.pickInfo?.pickedMesh;

            if (
                !this.animating &&
                pickedMesh &&
                (pickedMesh === this.doorMesh ||
                    pickedMesh.isDescendantOf(this.doorMesh))
            ) {
                this.animating = true;
                let currentAnimation;

                if (this.state === true) {
                    // if the door is closed, then play the open animation
                    currentAnimation = this.animations[0];
                } else {
                    currentAnimation = this.animations[1];
                }

                this.scene.beginDirectAnimation(
                    this.doorMesh,
                    [currentAnimation],
                    0,
                    60,
                    false,
                    1.5,
                    () => {
                        this.animating = false;
                        this.state = !this.state;
                    }
                );
            }
        }
    };
}

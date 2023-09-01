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
import { sop } from "./Constants";
import { log } from "./utils";

export class FireCabinet {
    doorMesh: AbstractMesh;
    scene: Scene;
    onPointerDownObserver: Observer<PointerInfo>;
    animations: Animation[];
    animating: boolean;
    state: boolean; // true = closed, false = opened

    constructor(room: Mesh[]) {
        // this.doorMesh = MeshBuilder.CreateBox("firedoor", {
        //     size: 0.2,
        //     width: 0.05,
        // });

        log(room[0]);

        this.scene = room[0].getScene();

        log(this.scene);

        let cabinet = room.find((curMesh) => curMesh.name === "FireExtinguisherCabinet");

        this.doorMesh = room.find((curMesh) => 
            curMesh.name === "Door"
        );

        this.doorMesh.rotationQuaternion = null

        this.animations = [];

        let rotationAnimation = new Animation(
            `rotateAroundY`,
            "rotation.y",
            60,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        let keyFrames = [];
        let closed = {
            value: 0,
        };

        let opened = {
            value: -Math.PI / 2,
        }

        keyFrames.push({...closed, frame:0});
        keyFrames.push({...opened, frame:60});

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

        keyFrames.push({...opened, frame:0});
        keyFrames.push({...closed, frame:60});

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
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN && sop.failed) {
            const pickedMesh = pointerInfo.pickInfo?.pickedMesh;

            if (
                !this.animating &&
                pickedMesh &&
                (pickedMesh === this.doorMesh ||
                    pickedMesh.isDescendantOf(this.doorMesh))
            ) {
                this.animating = true;
                let currentAnimation;

                log("Click!");

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

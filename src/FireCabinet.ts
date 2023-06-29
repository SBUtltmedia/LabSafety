import { Camera, Mesh, MeshBuilder, Scene, Vector3, Animation, Observer, PointerInfo, PointerEventTypes } from "@babylonjs/core";

export class FireCabinet {
    doorMesh: Mesh
    scene: Scene
    onPointerDownObserver: Observer<PointerInfo>
    animation: Animation;

    constructor(scene: Scene) {
        this.doorMesh = MeshBuilder.CreateBox("firedoor", {size: 0.2, width: 0.05});
        this.scene = scene;

        let camera: Camera = scene.activeCamera;

        this.doorMesh.position = camera.position.add(new Vector3(0, -0.5, 1.75));
        this.doorMesh.rotation.y = Math.PI / 2;

        let rotationAnimation = new Animation(`rotateAroundY`, 'rotation.y', 60, 
                                             Animation.ANIMATIONTYPE_FLOAT, 
                                             Animation.ANIMATIONLOOPMODE_CONSTANT);

        let keyFrames = [];

        keyFrames.push({
            frame: 0,
            value: Math.PI / 2
        });
        keyFrames.push({
            frame: 60,
            value: Math.PI
        });

        this.doorMesh.animations.push(rotationAnimation);
        rotationAnimation.setKeys(keyFrames);

        this.animation = rotationAnimation;

        // @ts-ignore
        this.onPointerDownObserver = scene.onPointerObservable.add(this.rotateAroundY);
    }

    rotateAroundY = (pointerInfo = { type: PointerEventTypes.POINTERDOWN, pickInfo: { pickedMesh: this.doorMesh } }) => {

        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
            const pickedMesh = pointerInfo.pickInfo?.pickedMesh;

           if ((pickedMesh && (pickedMesh === this.doorMesh || pickedMesh.isDescendantOf(this.doorMesh)))) {
                this.scene.beginDirectAnimation(
                    this.doorMesh,
                    [this.animation],
                    0,
                    60,
                    false,
                    0.5,
                    () => {
                        console.log("Animation done!");
                    }
                )
           }
        }
    }
}
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Behavior } from '@babylonjs/core/Behaviors/behavior';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Nullable } from '@babylonjs/core/types';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Animation } from '@babylonjs/core/Animations/animation';
import { PointerEventTypes, PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { Observer } from '@babylonjs/core/Misc/observable';
import { WebXRExperienceHelper, WebXRState } from '@babylonjs/core/XR';
import { BASE_FPS } from './Constants';

export default class FlyToCameraBehavior implements Behavior<AbstractMesh> {
    flying: boolean = false;  // The mesh is currently being animated
    active: boolean = false;  // The mesh is not currently being animated and the last animation to occur was toward the camera (in the positive direction)
    camera!: Camera;
    mesh!: AbstractMesh;
    offset: number = 0.4;
    animations: Animation[];
    returnPosition!: Vector3;
    returnRotation!: Vector3;
    onPointerDownObserver!: Observer<PointerInfo>;
    xrCamera?: WebXRExperienceHelper;

    constructor(currentXr?: WebXRExperienceHelper) {
        const translationAnimation = new Animation('translate', 'position', BASE_FPS, Animation.ANIMATIONTYPE_VECTOR3);
        const rotationAnimation = new Animation('rotate', 'rotation', BASE_FPS, Animation.ANIMATIONTYPE_VECTOR3);
        this.animations = [translationAnimation, rotationAnimation];
        this.xrCamera = currentXr;
    }

    get name() {
        return 'FlyToCamera';
    }

    init() {

    }

    attach = (mesh: AbstractMesh, camera?: Nullable<Camera>, returnPosition?: Vector3, returnRotation?: Vector3, offset?: number) => {
        const scene = mesh.getScene();
        this.mesh = mesh;
        if (!camera) {
            camera = scene.activeCamera;
            if (!camera) {
                throw new Error('The scene has no active camera, and no camera was provided.');
            }
        }
        this.camera = camera;
        if (!returnPosition) {
            returnPosition = this.mesh.position;
        }
        if (!returnRotation) {
            returnRotation = this.mesh.rotation;
        }
        if (offset) {
            this.offset = offset;
        }
        this.returnPosition = returnPosition;
        this.returnRotation = returnRotation;

        this.onPointerDownObserver = scene.onPointerObservable.add(this.clipboardClick)!;
    }

    detach = () => {
        this.mesh.getScene().onPointerObservable.remove(this.onPointerDownObserver);
    }
    clipboardClick = (pointerInfo = { type: PointerEventTypes.POINTERDOWN, pickInfo: { pickedMesh: this.mesh } }) => {
        
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
            console.log("Clipboard click");
            // If the picked mesh is a child of the mesh, create and start the animation
            const pickedMesh = pointerInfo.pickInfo?.pickedMesh;
            if ((pickedMesh && (pickedMesh === this.mesh || pickedMesh.isDescendantOf(this.mesh)) && !this.flying) || this.active) {
                // The user clicked on the mesh or its descendant
                const from = this.active ? BASE_FPS / 2 : 0;
                const to = this.active ? 0 : BASE_FPS / 2;
                //const targetPosition = this.active ? this.returnPosition : this.calculateTargetPositionWithOffset(this.offset);  // Might have counterintuitive effects if the clipboard is e.g. collided out of place
                this.#setAnimationKeys();
                this.flying = true;
                if (this.mesh.billboardMode == AbstractMesh.BILLBOARDMODE_ALL) {
                    this.mesh.billboardMode = AbstractMesh.BILLBOARDMODE_NONE;
                } else {
                    this.mesh.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
                }
                const scene = this.mesh.getScene();
                scene.beginDirectAnimation(this.mesh, this.animations, from, to, false, undefined, () => {
                    this.flying = false;
                    this.active = !this.active;

                    // this.mesh.parent = scene.activeCamera;

                });

            }
        }
    }
    calculateTargetPositionWithOffset = (offset: number) => {
        if (this.xrCamera !== undefined && this.xrCamera.state === WebXRState.IN_XR) {
            const diff = this.xrCamera.camera._position.subtract(this.returnPosition);
            const addend = diff.scale(1 - (offset / Vector3.Distance(this.returnPosition, this.xrCamera.camera._position)));
            const targetPosition = this.returnPosition.add(addend);
            return targetPosition;
        }
        const diff = this.camera._position.subtract(this.returnPosition);
        const addend = diff.scale(1 - (offset / Vector3.Distance(this.returnPosition, this.camera._position)));
        const targetPosition = this.returnPosition.add(addend);

        return targetPosition;
    }

    setClipboardUp = () => {
        return new Vector3(3.1468286, 4.6617744, 1.680752);
    }

    #setAnimationKeys = () => {
        const translationAnimation = this.animations.find(({ name }) => name === 'translate')!;
        const rotationAnimation = this.animations.find(({ name }) => name === 'rotate')!;
        const translationKeys = [{ frame: 0, value: this.returnPosition }, { frame: BASE_FPS / 2, value: this.calculateTargetPositionWithOffset(this.offset) }];
        const rotationKeys = [{ frame: 0, value: this.returnRotation }, { frame: BASE_FPS / 2, value: this.setClipboardUp() }];
        translationAnimation.setKeys(translationKeys)
        rotationAnimation.setKeys(rotationKeys);
    }
}
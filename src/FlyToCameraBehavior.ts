import { Camera } from '@babylonjs/core/Cameras/camera';
import { Behavior } from '@babylonjs/core/Behaviors/behavior';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Nullable } from '@babylonjs/core/types';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Animation } from '@babylonjs/core/Animations/animation';
import { PointerEventTypes, PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { Observer } from '@babylonjs/core/Misc/observable';

import { BASE_FPS } from './constants';


export default class FlyToCameraBehavior implements Behavior<AbstractMesh> {
    flying: boolean = false;  // The mesh is currently being animated
    active: boolean = false;  // The mesh is not currently being animated and the last animation to occur was toward the camera (in the positive direction)
    camera!: Camera;
    mesh!: AbstractMesh;
    offset: number = 0.5;
    animations: Animation[];
    returnPosition!: Vector3;
    returnRotation!: Vector3;
    onPointerDownObserver!: Observer<PointerInfo>;

    constructor() {
        const translationAnimation = new Animation('translate', 'position', BASE_FPS, Animation.ANIMATIONTYPE_VECTOR3);
        const rotationAnimation = new Animation('rotate', 'rotation', BASE_FPS, Animation.ANIMATIONTYPE_VECTOR3);
        this.animations = [translationAnimation, rotationAnimation];
        // this.animations = [translationAnimation];  // TEMP
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

        this.onPointerDownObserver = scene.onPointerObservable.add(pointerInfo => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                // If the picked mesh is a child of the mesh, create and start the animation
                const pickedMesh = pointerInfo.pickInfo?.pickedMesh;
                if (pickedMesh) {
                    if (pickedMesh === this.mesh || pickedMesh.isDescendantOf(this.mesh)) {
                        // The user clicked on the mesh or its descendant
                        if (!this.flying) {
                            const from = this.active ? BASE_FPS / 2 : 0;
                            const to = this.active ? 0 : BASE_FPS / 2;
                            const targetPosition = this.active ? this.returnPosition : this.calculateTargetPositionWithOffset(this.offset);  // Might have counterintuitive effects if the clipboard is e.g. collided out of place
                            this.#setAnimationKeys();
                            this.flying = true;
                            scene.beginDirectAnimation(this.mesh, this.animations, from, to, false, undefined, () => {
                                this.flying = false;
                                this.active = !this.active;
                            });
                        }
                    }
                }
            }
        })!;
    }

    detach = () => {
        this.mesh.getScene().onPointerObservable.remove(this.onPointerDownObserver);
    }

    calculateTargetPositionWithOffset = (offset: number) => {
        const diff = this.camera.position.subtract(this.returnPosition);
        const addend = diff.scale(1 - (offset / Vector3.Distance(this.returnPosition, this.camera.position)));
        const targetPosition = this.returnPosition.add(addend);
        return targetPosition;
    }

    calculateTargetRotation = () => {
        // TODO: base the target rotation off the direction the camera is facing
        return new Vector3(0, Math.PI / 4, 5 * Math.PI / 3);
    }

    #setAnimationKeys = () => {
        // TODO: update instead?
        const translationAnimation = this.animations.find(({ name }) => name === 'translate')!;
        const rotationAnimation = this.animations.find(({ name }) => name === 'rotate')!;
        const translationKeys = [{ frame: 0, value: this.returnPosition }, { frame: BASE_FPS / 2, value: this.calculateTargetPositionWithOffset(this.offset) }];
        const rotationKeys = [{ frame: 0, value: this.returnRotation }, { frame: BASE_FPS / 2, value: this.calculateTargetRotation() }];
        translationAnimation.setKeys(translationKeys)
        rotationAnimation.setKeys(rotationKeys);
    }
}
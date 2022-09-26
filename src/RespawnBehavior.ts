import { Behavior } from '@babylonjs/core/Behaviors/behavior';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Nullable } from '@babylonjs/core/types';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Observer } from '@babylonjs/core/Misc/observable';
import { Scene } from '@babylonjs/core/scene';

import { FADE_IN_OUT_TIME, MS_PER_FRAME } from './constants';


export default class RespawnBehavior implements Behavior<AbstractMesh> {
    // TODO: This won't work in VR. Enable XR grab as an option for interaction.
    // TODO: I really dislike that interactableChildMesh has to go in the constructor. It separates the attachment of the main mesh and the interactable mesh. However, short of implementing an all-purpose way to check if a root mesh is being interacted with, I don't have another solution that uses behaviors.
    respawnPosition: Vector3;
    respawnTimeout: number;  // Milliseconds
    respawning: boolean;
    fading: boolean;
    timeLastInteracted: Nullable<number>;  // Currently, this only checks if PointerDrag is currently dragging
    lastFramePosition!: Vector3;
    fadeInOutTime: number;
    mesh!: AbstractMesh;
    interactableMesh!: AbstractMesh;  // The mesh to check if the mesh if currently being interacted with. This may be the mesh or a child mesh.
    observer: Nullable<Observer<Scene>>;
    activeTimerIDs: NodeJS.Timeout[];  // Only used to clear active timers when detached.
    intervalID!: NodeJS.Timeout;

    constructor(respawnPosition: Vector3, respawnTimeout: number, interactableChildMesh?: AbstractMesh, fadeInOutTime?: number) {
        this.respawnPosition = respawnPosition;
        this.respawnTimeout = respawnTimeout;
        this.respawning = false;
        this.fading = false;
        this.timeLastInteracted = null;
        this.fadeInOutTime = fadeInOutTime || FADE_IN_OUT_TIME;
        this.observer = null;
        this.activeTimerIDs = [];
        if (interactableChildMesh) {
            this.interactableMesh = interactableChildMesh;
        }
    }

    get name() {
        return 'Respawn';
    }

    init = () => {

    }

    attach = (mesh: AbstractMesh) => {
        this.mesh = mesh;
        this.lastFramePosition = this.mesh.position.clone();
        if (this.interactableMesh) {
            if (this.interactableMesh !== this.mesh && !this.interactableMesh.isDescendantOf(this.mesh)) {
                throw new Error(`${this.name}Behavior error: interactableChildMesh must be a child mesh of mesh.`);
            }
        } else {
            this.interactableMesh = this.mesh;
        }

        // TODO: also check if XR grab is enabled.
        if (!this.interactableMesh.getBehaviorByName('PointerDrag')) {
            throw new Error(`${this.name}Behavior error: interactableMesh must have an attached instance of PointerDragBehavior.`);
        }

        const scene = this.mesh.getScene();
        this.observer = scene.onBeforeRenderObservable.add(this.#renderFn);
    }

    #renderFn = () => {
        if (!this.respawning) {
            const pointerDragBehavior = this.interactableMesh.getBehaviorByName('PointerDrag') as Nullable<PointerDragBehavior>;
            if (!pointerDragBehavior) {
                throw new Error(`${this.name}Behavior error: PointerDragBehavior was detached from the interactable mesh.`);
            }

            const now = Date.now();
            if (pointerDragBehavior.dragging) {  // TODO: more generally, if the interactable mesh is currently being interacted with
                this.timeLastInteracted = now;
            } else if (!this.lastFramePosition.equals(this.mesh.position) && !this.mesh.position.equals(this.respawnPosition)) {
                this.timeLastInteracted = now;
            } else {
                if (this.timeLastInteracted) {
                    if (now - this.timeLastInteracted >= this.respawnTimeout) {
                        this.timeLastInteracted = null;
                        this.respawn();
                    }
                }
            }
        }
        this.lastFramePosition.copyFrom(this.mesh.position);
    }

    respawn = () => {
        this.respawning = true;
        this.fadeOut();
        const fadeOutTimerId = setTimeout(() => {
            const fadeOutTimerIdIndex = this.activeTimerIDs.indexOf(fadeOutTimerId);
            if (fadeOutTimerIdIndex !== -1) {
                this.activeTimerIDs.splice(fadeOutTimerIdIndex, 1);
            }
            this.mesh.position = this.respawnPosition.clone();
            this.fadeIn();
            const fadeInTimerId = setTimeout(() => {
                const fadeInTimerIdIndex = this.activeTimerIDs.indexOf(fadeInTimerId);
                if (fadeInTimerIdIndex !== -1) {
                    this.activeTimerIDs.splice(fadeInTimerIdIndex, 1);
                }
                this.respawning = false;
            }, this.fadeInOutTime);
            this.activeTimerIDs.push(fadeInTimerId);
        }, this.fadeInOutTime);
        this.activeTimerIDs.push(fadeOutTimerId);
    }

    fade = (fadeIn: boolean) => {
        if (!this.fading){
            this.fading = true;
            const alphaPerFrame = MS_PER_FRAME / this.fadeInOutTime;
            this.intervalID = setInterval(() => {
                this.#setAllVisibility(this.mesh, this.mesh.visibility + (fadeIn ? alphaPerFrame : -alphaPerFrame));
                if (fadeIn) {
                    if (this.mesh.visibility > 1) {
                        this.#setAllVisibility(this.mesh, 1);
                        this.fading = false;
                        clearInterval(this.intervalID);
                    }
                } else {
                    if (this.mesh.visibility < 0) {
                        this.#setAllVisibility(this.mesh, 0);
                        this.fading = false;
                        clearInterval(this.intervalID);
                    }
                }
            }, MS_PER_FRAME);
        }
    }

    fadeIn = () => {
        this.fade(true);
    }

    fadeOut = () => {
        this.fade(false);
    }

    detach = () => {
        const scene = this.mesh.getScene();
        scene.onBeforeRenderObservable.remove(this.observer);
        this.activeTimerIDs.forEach(clearTimeout);
    }

    #setAllVisibility = (mesh: AbstractMesh, visibility: number) => {
        mesh.visibility = visibility;
        mesh.getChildMeshes().forEach(childMesh => this.#setAllVisibility(childMesh, visibility));
    }
}

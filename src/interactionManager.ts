import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { PointerInput } from "@babylonjs/core/DeviceInput/InputDevices/deviceEnums";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { Observable } from "@babylonjs/core/Misc/observable";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRInputSource } from "@babylonjs/core/XR/webXRInputSource";
import { WebXRState } from "@babylonjs/core/XR/webXRTypes";
import { WebXRAbstractMotionController } from "@babylonjs/core/XR/motionController/webXRAbstractMotionController";

import { InteractableBehavior } from "./interactableBehavior";
import { log } from "./utils";

interface IModeSelectorMap {
    [mode: number]: {
        [id: number]: ISelector
    }
}

interface ISelector {
    anchor: AbstractMesh,
    grabber: AbstractMesh,
    grabbedMesh: Nullable<AbstractMesh>,
    targetMesh: Nullable<AbstractMesh>
}

export interface IGrabInfo {
    anchor: AbstractMesh,
    grabber: AbstractMesh,
    state: GrabState
}

export interface IActivationInfo {
    anchor: AbstractMesh,
    grabber: AbstractMesh,
    state: ActivationState
}

export enum InteractionMode {
    DESKTOP,
    XR,
    MOBILE,
    LOADING
}

export enum GrabState {
    GRAB,
    DROP
}

export enum ActivationState {
    ACTIVE,
    INACTIVE
}

const SELECTOR_LENGTH = 3.0;
const SELECTOR_DIAMETER = 0.005;

export class InteractionManager {
    onGrabStateChangedObservable: Observable<IGrabInfo> = new Observable();
    onActivationStateChangedObservable: Observable<IActivationInfo> = new Observable();
    #scene: Scene;
    #highlightLayer: HighlightLayer;
    modeSelectorMap: IModeSelectorMap = {
        [InteractionMode.DESKTOP]: {},
        [InteractionMode.XR]: {},
        [InteractionMode.LOADING]: {},
    };
    hasDefaultSelector: boolean = false;
    #activeTargets: AbstractMesh[] = [];
    interactionMode: InteractionMode = InteractionMode.LOADING;
    interactableMeshes: AbstractMesh[] = [];

    xrExperience?: WebXRDefaultExperience;

    constructor(scene: Scene, xrExperience?: WebXRDefaultExperience) {
        this.#scene = scene;
        if (xrExperience) {
            this.xrExperience = xrExperience;
            this.xrExperience.input.controllers.forEach(this.#configureController);
            this.xrExperience.input.onControllerAddedObservable.add(this.#configureController);
            
            if (this.xrExperience.baseExperience.state === WebXRState.NOT_IN_XR) {
                this.#switchMode(InteractionMode.DESKTOP);
                if (!this.hasDefaultSelector) {
                    this.configureDesktopInteraction(this.#scene.activeCamera);
                }
            } else if (this.xrExperience.baseExperience.state === WebXRState.IN_XR) {
                this.interactionMode = InteractionMode.XR;
            } else {
                this.interactionMode = InteractionMode.LOADING;
            }
            
            this.xrExperience.baseExperience.onStateChangedObservable.add(state => {
                if (state === WebXRState.NOT_IN_XR) {
                    this.#switchMode(InteractionMode.DESKTOP);
                    if (!this.hasDefaultSelector) {
                        this.configureDesktopInteraction(this.#scene.activeCamera);
                    }
                } else if (state === WebXRState.IN_XR) {
                    this.#switchMode(InteractionMode.XR);
                } else {
                    this.#switchMode(InteractionMode.LOADING);
                }
            });
        } else {
            this.#switchMode(InteractionMode.DESKTOP);
        }
        this.#highlightLayer = new HighlightLayer("interaction-highlight-layer");

        this.#scene.onBeforeRenderObservable.add(() => {
            // Clear targets from previous render
            this.#activeTargets.splice(0, this.#activeTargets.length);
            
            // Find valid targets for active selectors
            const selectors = this.getActiveSelectors();
            const grabbedMeshes = selectors
                .filter(({ grabbedMesh }) => Boolean(grabbedMesh))
                .map(({ grabbedMesh }) => grabbedMesh);
            const availableSelectors = selectors.filter(({ grabbedMesh }) => !Boolean(grabbedMesh)); // Selectors not currently grabbing
            const validTargets = this.interactableMeshes.filter(mesh => !grabbedMeshes.includes(mesh)); // Interactables not currently grabbed
            const targets: {
                [id: number]: AbstractMesh
            } = {};
            for (const selector of availableSelectors) {
                const targetMeshes = [];
                for (const target of validTargets) {
                    if (selector.grabber.intersectsMesh(target, true)) {
                        targetMeshes.push(target);
                    }
                }
                selector.targetMesh = this.#selectTarget(selector.grabber, targetMeshes);
                if (selector.targetMesh) {
                    targets[selector.targetMesh.uniqueId] = selector.targetMesh;
                }
            }
            this.#activeTargets.push(...Object.values(targets));

            // Highlight all valid targets
            this.#highlightLayer.removeAllMeshes();
            for (const target of this.#activeTargets) {
                if (target instanceof Mesh) {
                    this.#highlightLayer.addMesh(target, Color3.Gray());
                }
            }
        });
    }

    #configureController = (controller: WebXRInputSource) => {
        if (controller.motionController) {
            this.#configureMotionController(controller.motionController, controller.pointer.uniqueId);
        }
        controller.onMotionControllerInitObservable.add(motionController => {
            this.#configureMotionController(motionController, controller.pointer.uniqueId);
        });
    }

    #configureMotionController = (motionController: WebXRAbstractMotionController, anchorId: number) => {
        const squeeze = motionController.getComponentOfType("squeeze");
        if (squeeze) {
            squeeze.onButtonStateChangedObservable.add(() => {
                if (squeeze.changes.pressed) {
                    this.#checkGrab(squeeze.pressed, anchorId);
                }
            });
        } else {
            log("Squeeze component not found on motion controller.");
        }

        const select = motionController.getMainComponent();
        if (select) {
            select.onButtonStateChangedObservable.add(() => {
                if (select.changes.pressed) {
                    this.#checkActivate(select.pressed, anchorId);
                }
            });
        } else {
            log("Main component not found on motion controller.");
        }
    }

    #checkGrab = (grab: boolean, anchorId: number) => {
        const selector = this.modeSelectorMap[this.interactionMode][anchorId];
        if (grab) {
            if (selector.targetMesh) {
                selector.grabbedMesh = selector.targetMesh;
                selector.targetMesh = null;
                this.#notifyGrabMeshObserver(selector.grabbedMesh, { anchor: selector.anchor, grabber: selector.grabber, state: GrabState.GRAB });
            }
        } else {
            if (selector.grabbedMesh) {
                this.#notifyGrabMeshObserver(selector.grabbedMesh, { anchor: selector.anchor, grabber: selector.grabber, state: GrabState.DROP});
                selector.grabbedMesh = null;
            }
        }
    }

    #checkActivate = (activate: boolean, anchorId: number) => {
        const { anchor, grabber, grabbedMesh } = this.modeSelectorMap[this.interactionMode][anchorId];
        if (!grabbedMesh) {
            return;
        }
        // Note that we notify the behavior even if it isn't active or even activatable.
        // This is handled in the InteractableBehavior.
        if (activate) {
            this.#notifyActivationMeshObserver(grabbedMesh, { anchor, grabber, state: ActivationState.ACTIVE });
        } else {
            this.#notifyActivationMeshObserver(grabbedMesh, { anchor, grabber, state: ActivationState.INACTIVE });
        }
    }

    #notifyGrabMeshObserver = (mesh: AbstractMesh, grabInfo: IGrabInfo) => {
        if (mesh.isDisposed()) {
            // If the mesh is grabbed by any selector, set it to null.
            // Don't notify observers, because the mesh's behaviors
            // were detached on disposal.
            for (const mode in this.modeSelectorMap) {
                for (const selector of Object.values(this.modeSelectorMap[mode])) {
                    if (selector.grabbedMesh === mesh) {
                        selector.grabbedMesh = null;
                    }
                }
            }
            return;
        }
        const behavior = mesh.getBehaviorByName("Interactable") as InteractableBehavior;
        if (!behavior) {
            throw new Error("InteractionManager: grabbed mesh must have InteractableBehavior.");
        }
        this.onGrabStateChangedObservable.notifyObserver(behavior.grabStateObserver, grabInfo);
    }

    #notifyActivationMeshObserver = (mesh: AbstractMesh, activationInfo: IActivationInfo) => {
        if (mesh.isDisposed()) {
            // @todo: I don't like that we have to handle this here.
            return;
        }
        const behavior = mesh.getBehaviorByName("Interactable") as InteractableBehavior;
        if (!behavior) {
            throw new Error("InteractionManager: activated mesh must have InteractableBehavior.");
        }
        this.onActivationStateChangedObservable.notifyObserver(behavior.activationStateObserver, activationInfo, mesh.uniqueId);
    }

    #switchMode = (mode: InteractionMode) => {
        const selectors = this.getActiveSelectors();
        
        // Drop everything
        for (const selector of selectors) {
            this.#notifyGrabMeshObserver(selector.grabbedMesh, { anchor: selector.anchor, grabber: selector.grabber, state: GrabState.DROP});
            selector.grabbedMesh = null;
        }

        this.interactionMode = mode;
    }

    addSelector = (anchorMesh: AbstractMesh, grabberMesh: AbstractMesh, modes: InteractionMode[]) => {
        const selectorObj: ISelector = {
            anchor: anchorMesh,
            grabber: grabberMesh,
            grabbedMesh: null,
            targetMesh: null
        };
        for (const mode of modes) {
            // Note: passed by reference
            this.modeSelectorMap[mode][anchorMesh.uniqueId] = selectorObj;
        }
    }

    configureDesktopInteraction = (camera: Camera) => {
        const grabber = CreateCylinder("default-grabber", {
            height: SELECTOR_LENGTH,
            diameter: SELECTOR_DIAMETER
        });
        grabber.isVisible = false;
        grabber.isPickable = false;
        grabber.setParent(camera);
        grabber.position.setAll(0);
        grabber.rotation.copyFromFloats(Math.PI / 2, 0, 0);

        const anchor = new AbstractMesh("default-anchor");
        anchor.isPickable = false;
        anchor.setParent(camera);
        anchor.position.copyFrom(Vector3.Forward());

        this.addSelector(anchor, grabber, [InteractionMode.DESKTOP]);
        this.hasDefaultSelector = true;

        this.#scene.onPointerObservable.add(pointerInfo => {
            if (pointerInfo.event.inputIndex === PointerInput.LeftClick) {
                if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                    this.#checkGrab(true, anchor.uniqueId);
                } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                    this.#checkGrab(false, anchor.uniqueId);
                }
            } else if (pointerInfo.event.inputIndex === PointerInput.RightClick) {
                if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                    this.#checkActivate(true, anchor.uniqueId);
                } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                    this.#checkActivate(false, anchor.uniqueId);
                }
            }
        });
    }

    getActiveSelectors = (): ISelector[] => {
        return Object.values(Object.values(this.modeSelectorMap[this.interactionMode]));
    }

    #selectTarget = (sourceMesh: AbstractMesh, targetMeshes: AbstractMesh[]): Nullable<AbstractMesh> => {
        return InteractionManager.#GetNearestTo(sourceMesh, targetMeshes, this.interactionMode);
    }

    static #GetNearestTo = (mesh: AbstractMesh, meshes: AbstractMesh[], mode: InteractionMode): Nullable<AbstractMesh> => {
        // XR mode, simply find the nearest to the mesh's position. In desktop mode, find the
        // nearest to the mesh's line.
        let nearest = null;
        let nearestScore = Number.POSITIVE_INFINITY;
        // @todo: Implement a custom comparison algorithm for desktop and mobile. For example,
        // Find the mesh with the smallest distance to the line from the origin of the grabber to the tip of
        // the grabber.
        switch (mode) {
            case InteractionMode.DESKTOP: // Fallthrough
            case InteractionMode.MOBILE: // Fallthrough
            case InteractionMode.XR:
                for (const neighbor of meshes) {
                    const distance = Vector3.Distance(mesh.getAbsolutePosition(), neighbor.getAbsolutePosition());
                    if (distance < nearestScore) {
                        nearest = neighbor;
                        nearestScore = distance;
                    }
                }
                break;
        }
        return nearest;
    }
}
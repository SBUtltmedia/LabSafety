import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { Observable } from "@babylonjs/core/Misc/observable";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRState } from "@babylonjs/core/XR/webXRTypes";

import { InteractableBehavior } from "../../behaviors/interactableBehavior";
import { IMeshGrabInfo, IMeshActivationInfo, InteractionMode, IGrabInfo, GrabState, ActivationState, IModeSelectorMap, ISelector, BaseInteractionHandler } from "./handlers/baseInteractionHandler";
import { DesktopInteractionHandler } from "./handlers/desktopInteractionHandler";
import { MobileInteractionHandler } from "./handlers/mobileInteractionHandler";
import { XRInteractionHandler } from "./handlers/xrInteractionHandler";
import { MeshSelector } from "../../systems/meshUtils";

const SELECTOR_LENGTH = 9.0;
const SELECTOR_DIAMETER = 0.005;

export class InteractionManager {
    onMeshGrabStateChangedObservable: Observable<IMeshGrabInfo> = new Observable();
    onMeshActivationStateChangedObservable: Observable<IMeshActivationInfo> = new Observable();
    onModeChangeObservable: Observable<InteractionMode> = new Observable();
    onHasAnyTargetsObservable: Observable<boolean> = new Observable();
    onGrabStateChangedObservable: Observable<IGrabInfo> = new Observable();

    scene: Scene;
    highlightLayer: HighlightLayer;
    modeSelectorMap: IModeSelectorMap = {
        [InteractionMode.DESKTOP]: {},
        [InteractionMode.XR]: {},
        [InteractionMode.MOBILE]: {},
        [InteractionMode.LOADING]: {},
    };
    hasDefaultSelector: boolean = false;
    #activeTargets: AbstractMesh[] = [];
    interactionMode: InteractionMode = InteractionMode.LOADING;
    interactableMeshes: AbstractMesh[] = []; // Meshes that can be interacted with

    xrExperience?: WebXRDefaultExperience;
    isUsingXRObservable: Observable<Boolean> = new Observable();

    currentInteractionHandler: Nullable<BaseInteractionHandler> = null;
    

    constructor(scene: Scene, xrExperience?: WebXRDefaultExperience) {
        this.scene = scene;

        if (xrExperience) {
            this.xrExperience = xrExperience;
            this.xrExperience.baseExperience.onStateChangedObservable.add(
                (state) => {
                    this.switchModeFromXRState(state);
                }
            );
        }

        this.switchModeFromXRState(
            this.xrExperience === undefined
                ? WebXRState.NOT_IN_XR
                : this.xrExperience.baseExperience.state
        );

        this.highlightLayer = new HighlightLayer("interaction-highlight-layer");

        this.scene.onBeforeRenderObservable.add(() => this.updateTargetsAndHighlight());
    }

    private updateTargetsAndHighlight(): void {
        const numPreviousTargets = this.#activeTargets.length;
        this.#activeTargets.splice(0, this.#activeTargets.length);

        const selectors = this.getActiveSelectors();
        const grabbedMeshes = selectors
            .filter(({ grabbedMesh }) => Boolean(grabbedMesh))
            .map(({ grabbedMesh }) => grabbedMesh);
        const availableSelectors = selectors.filter(
            ({ grabbedMesh }) => !Boolean(grabbedMesh)
        );
        const validTargets = this.interactableMeshes.filter(
            (mesh) => !grabbedMeshes.includes(mesh)
        );
        const targets: { [id: number]: AbstractMesh; } = {};

        for (const selector of availableSelectors) {
            const targetMeshes = [];
            for (const target of validTargets) {
                if (selector.grabber.intersectsMesh(target, true)) {
                    targetMeshes.push(target);
                }
            }
            selector.targetMesh = MeshSelector.getNearestTo( // Use MeshSelector helper
                selector.grabber,
                targetMeshes,
                this.interactionMode
            );
            if (selector.targetMesh) {
                targets[selector.targetMesh.uniqueId] = selector.targetMesh;
            }
        }
        this.#activeTargets.push(...Object.values(targets));

        this.highlightLayer.removeAllMeshes();
        for (const target of this.#activeTargets) {
            if (target instanceof Mesh) {
                this.highlightLayer.addMesh(target, Color3.Gray());
            }
        }

        if (this.#activeTargets.length === 0 && numPreviousTargets !== 0) {
            this.onHasAnyTargetsObservable.notifyObservers(false);
        } else if (
            this.#activeTargets.length !== 0 &&
            numPreviousTargets === 0
        ) {
            this.onHasAnyTargetsObservable.notifyObservers(true);
        }
    }

    private switchModeFromXRState = (state: WebXRState) => {
        console.log("-------------Switch from XR state --- ");
        if (state === WebXRState.NOT_IN_XR) {
            console.log("Not in XR");
            if (
                "ontouchstart" in window ||
                navigator.maxTouchPoints > 0 ||
                navigator.maxTouchPoints > 0
            ) {
                this.switchMode(InteractionMode.MOBILE);
            } else {
                this.switchMode(InteractionMode.DESKTOP);
            }
        } else if (state === WebXRState.IN_XR) {
            console.log("IN XR");
            this.switchMode(InteractionMode.XR);
        } else {
            console.log("In loading");
            this.switchMode(InteractionMode.LOADING);
        }
    };

    private switchMode = (mode: InteractionMode) => {
        // Drop everything before switching modes
        const selectors = this.getActiveSelectors();
        for (const selector of selectors) {
            if (selector.grabbedMesh) {
                this.notifyGrabMeshObserver(selector.grabbedMesh, {
                    anchor: selector.anchor,
                    grabber: selector.grabber,
                    state: GrabState.DROP,
                });
                selector.grabbedMesh = null;
            }
        }

        this.interactionMode = mode;
        this.onModeChangeObservable.notifyObservers(mode);
        this.isUsingXRObservable.notifyObservers(mode === InteractionMode.XR);

        if (
            (mode === InteractionMode.DESKTOP || mode === InteractionMode.MOBILE) &&
            !this.hasDefaultSelector
        ) {
            this.addDefaultSelector(this.scene.activeCamera);
        }

        // Set up the appropriate interaction handler for the new mode
        const defaultSelector = Object.values(this.modeSelectorMap[this.interactionMode])
            .find(({ anchor }) => anchor.name === "default-anchor");

        if (!defaultSelector && (mode === InteractionMode.DESKTOP || mode === InteractionMode.MOBILE)) {
            // This should ideally not happen if addDefaultSelector worked, but as a safeguard
            throw new Error(`Default selector not found for mode: ${InteractionMode[mode]}`);
        }

        if (this.currentInteractionHandler) {
            this.currentInteractionHandler.dispose();
        }
        this.currentInteractionHandler = null; // Let GC handle previous instance

		//@ts-ignore Create abstract mesh
        const anchorForHandler = defaultSelector ? defaultSelector.anchor : new AbstractMesh("dummy-anchor"); // Fallback for XR if no default anchor is used in handlers

        switch (mode) {
            case InteractionMode.DESKTOP:
                this.currentInteractionHandler = new DesktopInteractionHandler(
                    this.scene,
                    this.modeSelectorMap,
                    InteractionMode.DESKTOP,
                    anchorForHandler,
                    this.notifyGrabMeshObserver.bind(this),
                    this.notifyActivationMeshObserver.bind(this),
                    this.findGrabAndNotify.bind(this),
                    this.checkActivate.bind(this)
                );
                break;
            case InteractionMode.MOBILE:
                this.currentInteractionHandler = new MobileInteractionHandler(
                    this.scene,
                    this.modeSelectorMap,
                    InteractionMode.MOBILE,
                    anchorForHandler,
                    this.notifyGrabMeshObserver.bind(this),
                    this.notifyActivationMeshObserver.bind(this),
                    this.findGrabAndNotify.bind(this),
                    this.checkActivate.bind(this)
                );
                break;
            case InteractionMode.XR:
                if (!this.xrExperience) {
                    throw new Error("XR experience not provided for XR mode.");
                }

                this.currentInteractionHandler = new XRInteractionHandler(
                    this.scene,
                    this.modeSelectorMap,
                    InteractionMode.XR,
                    anchorForHandler,
                    this.notifyGrabMeshObserver.bind(this),
                    this.notifyActivationMeshObserver.bind(this),
                    this.findGrabAndNotify.bind(this),
                    this.checkActivate.bind(this),
                    this.xrExperience
                );
                break;
            case InteractionMode.LOADING:
                break;
        }
        if (this.currentInteractionHandler) {
            this.currentInteractionHandler.configure();
        }
    };

    addSelector = (
        anchorMesh: AbstractMesh,
        grabberMesh: AbstractMesh,
        modes: InteractionMode[]
    ) => {
        const selectorObj: ISelector = {
            anchor: anchorMesh,
            grabber: grabberMesh,
            grabbedMesh: null,
            targetMesh: null,
        };
        for (const mode of modes) {
            this.modeSelectorMap[mode][anchorMesh.uniqueId] = selectorObj;
        }
    };

    private addDefaultSelector = (camera: Camera) => {
        const grabber = CreateCylinder("default-grabber", {
            height: SELECTOR_LENGTH,
            diameter: SELECTOR_DIAMETER,
        });
        grabber.isVisible = false;
        grabber.isPickable = false;
        grabber.setParent(camera);
        grabber.position.setAll(0);
        grabber.rotation.copyFromFloats(0, 0, 0);

		//@ts-ignore Need to create an abstract mesh
        const anchor = new AbstractMesh("default-anchor", this.scene);
        anchor.isPickable = false;
        anchor.setParent(camera);
        anchor.position.copyFrom(new Vector3(0, 0, 1));

        this.addSelector(anchor, grabber, [
            InteractionMode.DESKTOP,
            InteractionMode.MOBILE,
        ]);
        this.hasDefaultSelector = true;
    };

    getActiveSelectors = (): ISelector[] => {
        return Object.values(this.modeSelectorMap[this.interactionMode]);
    };

    private findGrabAndNotify = (grab: boolean, anchorId: number) => {
        const selector = this.modeSelectorMap[this.interactionMode][anchorId];
        if (!selector) {
            console.warn(`Selector not found for anchorId: ${anchorId} in mode: ${InteractionMode[this.interactionMode]}`);
            return;
        }


        if (grab) {
            if (selector.targetMesh) {
                selector.grabbedMesh = selector.targetMesh;
                selector.targetMesh = null;
				console.log(selector.grabbedMesh, selector.anchor, selector.grabber);
                this.notifyGrabMeshObserver(selector.grabbedMesh, {
                    anchor: selector.anchor,
                    grabber: selector.grabber,
                    state: GrabState.GRAB,
                });
            }
        } else {
            if (selector.grabbedMesh) {
                this.notifyGrabMeshObserver(selector.grabbedMesh, {
                    anchor: selector.anchor,
                    grabber: selector.grabber,
                    state: GrabState.DROP,
                });
                selector.grabbedMesh = null;
            }
        }
    };

    private checkActivate = (activate: boolean, anchorId: number) => {
        const { anchor, grabber, grabbedMesh } = this.modeSelectorMap[this.interactionMode][anchorId];
        console.log(anchor, grabbedMesh, grabber);
        if (!grabbedMesh) {
            return;
        }

        if (activate) {
            this.notifyActivationMeshObserver(grabbedMesh, {
                anchor,
                grabber,
                state: ActivationState.ACTIVE,
            });
        } else {
            this.notifyActivationMeshObserver(grabbedMesh, {
                anchor,
                grabber,
                state: ActivationState.INACTIVE,
            });
        }
    };

    public notifyGrabMeshObserver = (mesh: AbstractMesh, grabInfo: IMeshGrabInfo) => {
        if (mesh.isDisposed()) {
            for (const mode in this.modeSelectorMap) {
                for (const selector of Object.values(
                    this.modeSelectorMap[mode]
                )) {
                    if (selector.grabbedMesh === mesh) {
                        selector.grabbedMesh = null;
                    }
                }
            }
            return;
        }
        const behavior = mesh.getBehaviorByName(
            "Interactable"
        ) as Nullable<InteractableBehavior>; // Use Nullable
        if (!behavior) {
            throw new Error(
                "InteractionManager: grabbed mesh must have InteractableBehavior."
            );
        }
        this.onMeshGrabStateChangedObservable.notifyObserver(
            behavior.grabStateObserver,
            grabInfo
        );
        this.onGrabStateChangedObservable.notifyObservers({
            mesh,
            state: grabInfo.state,
        });
    };

    private notifyActivationMeshObserver = (
        mesh: AbstractMesh,
        activationInfo: IMeshActivationInfo
    ) => {
        if (mesh.isDisposed()) {
            return;
        }
        const behavior = mesh.getBehaviorByName(
            "Interactable"
        ) as Nullable<InteractableBehavior>; // Use Nullable
        if (!behavior) {
            throw new Error(
                "InteractionManager: activated mesh must have InteractableBehavior."
            );
        }

        console.log("Trying to notify: ", activationInfo);
        this.onMeshActivationStateChangedObservable.notifyObserver(
            behavior.activationStateObserver,
            activationInfo,
            mesh.uniqueId
        );
    };	
}

export { InteractionMode };
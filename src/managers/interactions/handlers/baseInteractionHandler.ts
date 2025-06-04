import { Scene, AbstractMesh, UniversalCamera, Nullable, PointerDragBehavior, Vector3, PointerInput, Matrix, KeyboardEventTypes, SixDofDragBehavior, PointerInfo, Observer, Observable, WebXRDefaultExperience } from "@babylonjs/core";
import { InteractableBehavior } from "../../../behaviors/interactableBehavior";
import { CameraRotator } from "../../../systems/cameraUtils";
import { DesktopInteractionHandler } from "./desktopInteractionHandler";
import { MobileInteractionHandler } from "./mobileInteractionHandler";
import { XRInteractionHandler } from "./xrInteractionHandler";

export interface IModeSelectorMap {
    [mode: number]: {
        [id: number]: ISelector;
    };
}

export interface ISelector {
    anchor: AbstractMesh;
    grabber: AbstractMesh;
    grabbedMesh: Nullable<AbstractMesh>;
    targetMesh: Nullable<AbstractMesh>;
}

export interface IMeshGrabInfo {
    anchor: AbstractMesh;
    grabber: AbstractMesh;
    state: GrabState;
}

export interface IMeshActivationInfo {
    anchor: AbstractMesh;
    grabber: AbstractMesh;
    state: ActivationState;
}

export interface IGrabInfo {
    mesh: AbstractMesh;
    state: GrabState;
}

export enum InteractionMode {
    DESKTOP,
    XR,
    MOBILE,
    LOADING,
}

export enum GrabState {
    GRAB,
    DROP,
}

export enum ActivationState {
    ACTIVE,
    INACTIVE,
}

export interface InteractionHandlerConfig {
    scene: Scene;
    modeSelectorMap: IModeSelectorMap;
    interactionMode: InteractionMode;
    anchor: AbstractMesh;
    xrCamera: WebXRDefaultExperience;
    onMeshGrabStateChangedObservable: Observable<any>;
    onGrabStateChangedObservable: Observable<any>;
    onMeshActivationStateChangedObservable: Observable<any>;
}

export abstract class BaseInteractionHandler {
    protected scene: Scene;
    protected modeSelectorMap: IModeSelectorMap;
    protected interactionMode: InteractionMode;
    protected anchor: AbstractMesh; // The default anchor for this mode
    protected camera: UniversalCamera;
    protected cylinderNames: string[] = ["cylinder-a", "cylinder-b", "cylinder-c"];
    protected clickableObjectsIds: Nullable<string>[] = [];
    protected canvas: HTMLCanvasElement;
    protected xrExperience: WebXRDefaultExperience;

    protected pointerDragStartObserver: Observer<any>;
    protected pointerDragObserver: Observer<any>;
    protected pointerDragEndObserver: Observer<any>;
    protected onMeshGrabStateChangedObservable: Observable<any>;
    protected onGrabStateChangedObservable: Observable<any>;
    protected onMeshActivationStateChangedObservable: Observable<any>;

    constructor(
        config: InteractionHandlerConfig
    ) {
        this.scene = config.scene;
        this.modeSelectorMap = config.modeSelectorMap;
        this.interactionMode = config.interactionMode;
        this.anchor = config.anchor;
        this.camera = config.scene.activeCamera as UniversalCamera;
        this.canvas = config.scene.getEngine().getRenderingCanvas();
        this.onMeshGrabStateChangedObservable = config.onMeshGrabStateChangedObservable;
        this.onGrabStateChangedObservable = config.onGrabStateChangedObservable;
        this.onMeshActivationStateChangedObservable = config.onMeshActivationStateChangedObservable;
        this.xrExperience = config.xrCamera;

        this.initializeClickableObjects();
    }

    private initializeClickableObjects(): void {
        this.clickableObjectsIds.push("clipboard");
        this.clickableObjectsIds.push("fire-extinguisher");
    }

    // Abstract method that concrete handlers must implement
    public abstract configure(): void;

    private getMeshInClickableMeshs(pickedMesh: AbstractMesh): AbstractMesh {
        if (!pickedMesh) {
            return null;
        }

        let topLevelMesh: Nullable<AbstractMesh> = pickedMesh;

        while (topLevelMesh.parent !== null && topLevelMesh.parent !== undefined) {
            topLevelMesh = topLevelMesh.parent as AbstractMesh;
        }

        if (this.clickableObjectsIds.includes(topLevelMesh.id)) {
            return topLevelMesh;
        }
        return null;
    }

    protected setupClickableObjectInteractions(): void {
        let pickedMesh: Nullable<AbstractMesh>;

        const castRay = (pointerEvent: PointerEvent) => {
            if (pointerEvent.button === 0) { // Left click
                const ray = this.scene.createPickingRay(
                    this.scene.pointerX,
                    this.scene.pointerY,
                    Matrix.Identity(),
                    this.scene.activeCamera
                );
                const hit = this.scene.pickWithRay(ray);
                if (hit?.pickedMesh) {
                    let curPickedMesh: Nullable<AbstractMesh> = this.getMeshInClickableMeshs(hit.pickedMesh);

                    if (curPickedMesh) {
                        this.modeSelectorMap[this.interactionMode][
                            this.anchor.uniqueId
                        ].targetMesh = curPickedMesh;

                        pickedMesh = curPickedMesh;
                        this.findGrabAndNotify(true, this.anchor.uniqueId);
                    }
                }
            }
        };

        const drop = (event: PointerEvent) => {
            if (
                this.modeSelectorMap[this.interactionMode][this.anchor.uniqueId].grabbedMesh &&
                pickedMesh &&
                this.clickableObjectsIds.includes(pickedMesh.id) && event.button === 0
            ) {
                pickedMesh = null;
                this.findGrabAndNotify(false, this.anchor.uniqueId);
            }
        };

        this.scene.onPointerUp = drop;
        this.scene.onPointerDown = castRay;
    }

    protected setupKeyboardInteraction(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (
                kbInfo.type === KeyboardEventTypes.KEYUP &&
                kbInfo.event.key === "x"
            ) {
                this.findGrabAndNotify(false, this.anchor.uniqueId);
            }
        });
    }

    public dispose(): void {
        console.log("Method not implemented!");
    }

    protected findGrabAndNotify(grab: boolean, anchorId: number) {
        const selector = this.modeSelectorMap[this.interactionMode][anchorId];
        if (!selector) {
            console.warn(`Selector not found for anchorId: ${anchorId} in mode: ${InteractionMode[this.interactionMode]}`);
            return;
        }

        if (grab) {
            if (selector.targetMesh) {
                selector.grabbedMesh = selector.targetMesh;
                selector.targetMesh = null;

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

    protected notifyActivationMeshObserver = (
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

        this.onMeshActivationStateChangedObservable.notifyObserver(
            behavior.activationStateObserver,
            activationInfo,
            mesh.uniqueId
        );
    };

    protected checkActivate = (activate: boolean, anchorId: number) => {
        const { anchor, grabber, grabbedMesh } = this.modeSelectorMap[this.interactionMode][anchorId];
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
}
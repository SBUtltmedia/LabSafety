import { Scene, AbstractMesh, UniversalCamera, Nullable, PointerDragBehavior, Vector3, PointerInput, Matrix, KeyboardEventTypes } from "@babylonjs/core";
import { InteractableBehavior } from "../../../behaviors/interactableBehavior";
import { CameraRotator } from "../../../systems/cameraUtils";

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

export abstract class BaseInteractionHandler {
    protected scene: Scene;
    protected modeSelectorMap: IModeSelectorMap;
    protected interactionMode: InteractionMode;
    protected anchor: AbstractMesh; // The default anchor for this mode
    protected camera: UniversalCamera;
    protected cylinderNames: string[] = ["cylinder-a", "cylinder-b", "cylinder-c"];
    protected clickableObjectsIds: Nullable<string>[] = [];
    protected canvas: HTMLCanvasElement;

    // Callbacks to communicate with the main InteractionManager
    protected notifyGrabMeshObserver: (mesh: AbstractMesh, grabInfo: IMeshGrabInfo) => void;
    protected notifyActivationMeshObserver: (mesh: AbstractMesh, activationInfo: IMeshActivationInfo) => void;
    protected findGrabAndNotify: (grab: boolean, anchorId: number) => void;
    protected checkActivate: (activate: boolean, anchorId: number) => void;
    protected cameraRotator: CameraRotator;


    constructor(
        scene: Scene,
        modeSelectorMap: IModeSelectorMap,
        interactionMode: InteractionMode,
        anchor: AbstractMesh,
        notifyGrabMeshObserver: (mesh: AbstractMesh, grabInfo: IMeshGrabInfo) => void,
        notifyActivationMeshObserver: (mesh: AbstractMesh, activationInfo: IMeshActivationInfo) => void,
        findGrabAndNotify: (grab: boolean, anchorId: number) => void,
        checkActivate: (activate: boolean, anchorId: number) => void,
    ) {
        this.scene = scene;
        this.modeSelectorMap = modeSelectorMap;
        this.interactionMode = interactionMode;
        this.anchor = anchor;
        this.camera = scene.activeCamera as UniversalCamera;
        this.canvas = scene.getEngine().getRenderingCanvas();

        this.notifyGrabMeshObserver = notifyGrabMeshObserver;
        this.notifyActivationMeshObserver = notifyActivationMeshObserver;
        this.findGrabAndNotify = findGrabAndNotify;
        this.checkActivate = checkActivate;
        this.cameraRotator = new CameraRotator(this.scene, this.camera, this.canvas);

        this.initializeClickableObjects();
    }

    private initializeClickableObjects(): void {
        this.clickableObjectsIds.push("clipboard");
        this.clickableObjectsIds.push("fire-extinguisher");
    }

    // Abstract method that concrete handlers must implement
    public abstract configure(): void;

    protected setupCylinderInteractions(): void {
        for (let cylinderName of this.cylinderNames) {
            const cylinderMesh = this.scene.getMeshByName(cylinderName);
            if (!cylinderMesh) {
                console.warn(`Cylinder mesh '${cylinderName}' not found.`);
                continue;
            }

            const interactableBehavior = cylinderMesh.getBehaviorByName("Interactable") as Nullable<InteractableBehavior>;
            if (interactableBehavior) {
                interactableBehavior.moveAttached = false;
            }

            const pointerDragBehavior = new PointerDragBehavior({
                dragPlaneNormal: new Vector3(0, 1, 0),
            });
            pointerDragBehavior.moveAttached = true;
            pointerDragBehavior.useObjectOrientationForDragging = false;

            pointerDragBehavior.onDragStartObservable.add((event) => {
                if (event.pointerInfo.event.inputIndex === PointerInput.LeftClick) {
                    let mesh = event.pointerInfo.pickInfo?.pickedMesh;
                    if (mesh) {
                        for (let cName of this.cylinderNames) {
                            if (mesh.id.startsWith(cName)) {
                                mesh = this.scene.getMeshByName(cName);
                                break;
                            }
                        }
                        this.modeSelectorMap[this.interactionMode][
                            this.anchor.uniqueId
                        ].targetMesh = mesh;
                        this.findGrabAndNotify(true, this.anchor.uniqueId);
                    }
                    this.cameraRotator.rotateCameraOnEdge();
                }
            });

            pointerDragBehavior.onDragEndObservable.add((event) => {
                if (event.pointerInfo.event.inputIndex === PointerInput.LeftClick) {
                    this.findGrabAndNotify(false, this.anchor.uniqueId);
                    this.cameraRotator.rotateCameraOnEdge();
                }
            });

            pointerDragBehavior.onDragObservable.add((event) => {
                if (event.pointerInfo.event.inputIndex === PointerInput.LeftClick) {
                    this.camera.attachControl(this.canvas, true);
                    this.cameraRotator.rotateCameraOnEdge();
                } else {
                    pointerDragBehavior.releaseDrag();
                }
            });

            cylinderMesh.addBehavior(pointerDragBehavior);
        }
    }

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
}
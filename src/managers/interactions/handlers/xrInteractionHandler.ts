import { WebXRDefaultExperience, Scene, AbstractMesh, Nullable, PointerDragBehavior, WebXRInputSource, WebXRAbstractMotionController, SixDofDragBehavior, Vector3, Ray, RayHelper, Color3, PickingInfo } from "@babylonjs/core";
import { InteractableBehavior } from "../../../behaviors/interactableBehavior";
import { BaseInteractionHandler, IModeSelectorMap, InteractionMode, IMeshGrabInfo, IMeshActivationInfo, GrabState } from "./baseInteractionHandler";

export class XRInteractionHandler extends BaseInteractionHandler {
    private configured: boolean = false;
    private xrExperience: WebXRDefaultExperience;
    private draggingWithSqueeze: boolean = false;
    private controllerDragging: Map<WebXRInputSource, Boolean> = new Map();
    private lastControllerDragging: Map<WebXRInputSource, Vector3> = new Map();
    private controllerDraggingMesh: Map<WebXRInputSource, Nullable<AbstractMesh>> = new Map();
    private sixDofDragBehaviors: Array<SixDofDragBehavior> = [];
    private isSqueezing: boolean = false;
    private isTrigger: boolean = false;

    constructor(
        scene: Scene,
        modeSelectorMap: IModeSelectorMap,
        interactionMode: InteractionMode,
        anchor: AbstractMesh,
        notifyGrabMeshObserver: (mesh: AbstractMesh, grabInfo: IMeshGrabInfo) => void,
        notifyActivationMeshObserver: (mesh: AbstractMesh, activationInfo: IMeshActivationInfo) => void,
        findGrabAndNotify: (grab: boolean, anchorId: number) => void,
        checkActivate: (activate: boolean, anchorId: number) => void,
        xrExperience: WebXRDefaultExperience
    ) {
        super(scene, modeSelectorMap, interactionMode, anchor, notifyGrabMeshObserver, notifyActivationMeshObserver, findGrabAndNotify, checkActivate);
        this.xrExperience = xrExperience;
    }

    public configure(): void {
        // comment for now
        // if (this.configured) {
        //     return;
        // }

        if (!this.xrExperience) {
            throw new Error(
                "Tried to configure XR interaction without an XR experience."
            );
        }

        // Disable scene-wide pointer events for XR, as XR controllers handle interaction
        this.scene.onPointerDown = null;
        this.scene.onPointerUp = null;

        for (let cylinderName of this.cylinderNames) {
            const mesh = this.scene.getMeshByName(cylinderName);
            if (mesh) {
                const interactableBehavior = mesh.getBehaviorByName("Interactable") as Nullable<InteractableBehavior>;
                if (interactableBehavior) {
                    interactableBehavior.moveAttached = false;
                }

                const pointerDragBehavior = mesh.getBehaviorByName("PointerDrag") as Nullable<PointerDragBehavior>;
                if (pointerDragBehavior) {
                    pointerDragBehavior.enabled = false;
                    pointerDragBehavior.detach();

                    let sixDofDragBehavior = new SixDofDragBehavior();

                    sixDofDragBehavior.onDragStartObservable.add(() => {
                        interactableBehavior.onGrabStateChangedObservable.notifyObservers({
                            anchor: null,
                            grabber: null,
                            state: GrabState.GRAB
                        });
                    });

                    sixDofDragBehavior.onDragEndObservable.add(() => {
                        interactableBehavior.onGrabStateChangedObservable.notifyObservers({
                            anchor: null,
                            grabber: null,
                            state: GrabState.DROP
                        });
                    });

                    this.sixDofDragBehaviors.push(sixDofDragBehavior);

                    mesh.addBehavior(sixDofDragBehavior);
                }
            }
        }

        this.xrExperience.input.controllers.forEach(this.configureController);
        this.xrExperience.input.onControllerAddedObservable.add(
            this.configureController
        );

        this.configured = true;
    }

    private configureController = (controller: WebXRInputSource) => {
        this.controllerDragging.set(controller, false);
        this.lastControllerDragging.set(controller, Vector3.Zero());

        if (controller.motionController) {
            this.configureMotionController(controller.motionController, controller.pointer.uniqueId, controller);
        }
        controller.onMotionControllerInitObservable.add((motionController) => {
            this.configureMotionController(motionController, controller.pointer.uniqueId, controller);
        });
    };

    private updateSixDofragBehaviorEnabled = () => {
        for (let sixDofDragBehavior of this.sixDofDragBehaviors) {
            sixDofDragBehavior.disableMovement = (this.isSqueezing || this.isTrigger);
        }
    }

    private configureMotionController = (
        motionController: WebXRAbstractMotionController,
        anchorId: number,
        controller: WebXRInputSource,
    ) => {
        const squeeze = motionController.getComponentOfType("squeeze");
        if (squeeze) {
            let sixDofDragBehavior: Nullable<SixDofDragBehavior>;
            let wasPressed: boolean = false;

            squeeze.onButtonStateChangedObservable.add(() => {
                if (squeeze.value >= 0.7) {
                    console.log("Checking squeeze");
                    wasPressed = true;
                    // this.findGrabAndNotify(squeeze.pressed, anchorId);
                    let pointer = controller.pointer;
                    let pointerPos = pointer.absolutePosition;
                    let dir = pointer.forward;
                    let ray = new Ray(pointerPos, dir, 0.2);

                    let rayHelper = new RayHelper(ray);
                    rayHelper.show(this.scene, new Color3(0, 0, 1));

                    const pickInfo = this.scene.pickWithRay(ray);

                    if (pickInfo && pickInfo.hit) {
                        this.isSqueezing = true;

                        const intersectMesh = pickInfo.pickedMesh;

                        let parentMesh = intersectMesh;

                        while (parentMesh.parent) {
                            parentMesh = parentMesh.parent as AbstractMesh;
                        }

                        sixDofDragBehavior = parentMesh.getBehaviorByName("SixDofDrag") as SixDofDragBehavior;
                        if (sixDofDragBehavior) {
                            sixDofDragBehavior.onDragStartObservable.notifyObservers({ position: controller.pointer.position });
                            this.draggingWithSqueeze = true;
                            this.controllerDragging.set(controller, true);
                            this.lastControllerDragging.set(controller, controller.pointer.position.clone());
                            this.controllerDraggingMesh.set(controller, parentMesh);
                        }
                    }
                } else if (wasPressed && squeeze.changes.value.current < 0.7) {
                    this.isSqueezing = false;
                    wasPressed = false;
                    this.draggingWithSqueeze = false;
                    this.controllerDragging.set(controller, false);
                    this.controllerDraggingMesh.set(controller, null);
                    if (sixDofDragBehavior) {
                        sixDofDragBehavior.onDragEndObservable.notifyObservers({});
                    }
                    this.updateSixDofragBehaviorEnabled();
                } else {
                    this.isSqueezing = false;
                    this.updateSixDofragBehaviorEnabled();
                }
            });
        } else {
            console.log("Squeeze component not found on motion controller.");
        }

        const trigger = motionController.getMainComponent();
        if (trigger) {
            trigger.onButtonStateChangedObservable.add(() => {
                if (trigger.value > 0) {
                    this.isTrigger = true;
                    if (trigger.changes.pressed) {
                        this.checkActivate(trigger.pressed, anchorId);
                    }
                } else {
                    this.isTrigger = false;
                }
                this.updateSixDofragBehaviorEnabled();
            });
        } else {
            console.log("Main component not found on motion controller.");
        }

        this.scene.onBeforeRenderObservable.add(() => {
            if (this.draggingWithSqueeze) {
                for (let entry of this.controllerDragging) {
                    if (entry[1]) {
                        let controller = entry[0];
                        if (controller.pointer && controller.pointer.position) {
                            const currentControllerPos = controller.pointer.position;
                            const delta = currentControllerPos.subtract(this.lastControllerDragging.get(controller));

                            let mesh = this.controllerDraggingMesh.get(controller);
                            if (mesh) {
                                mesh.position.addInPlace(delta);
                            }

                            this.lastControllerDragging.set(controller, currentControllerPos.clone());

                            let sixDofDragBehavior = mesh.getBehaviorByName("SixDofDrag") as SixDofDragBehavior;
                            if (sixDofDragBehavior) {
                                sixDofDragBehavior.onDragObservable.notifyObservers({
                                    delta: delta.clone(),
                                    position: currentControllerPos.clone(),
                                    pickInfo: new PickingInfo()
                                });
                            }
                        }
                    }
                }
            }
        });
    }
}

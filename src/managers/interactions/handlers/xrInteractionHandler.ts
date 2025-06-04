import { WebXRDefaultExperience, Scene, AbstractMesh, Nullable, PointerDragBehavior, WebXRInputSource, WebXRAbstractMotionController, SixDofDragBehavior, Vector3, Ray, RayHelper, Color3, PickingInfo, Observer, WebXRControllerComponent, PointerInfo, Observable } from "@babylonjs/core";
import { InteractableBehavior } from "../../../behaviors/interactableBehavior";
import { BaseInteractionHandler, IModeSelectorMap, InteractionMode, IMeshGrabInfo, IMeshActivationInfo, GrabState } from "./baseInteractionHandler";

export class XRInteractionHandler extends BaseInteractionHandler {
    private configured: boolean = false;
    private draggingWithSqueeze: boolean = false;
    private controllerDragging: Map<WebXRInputSource, Boolean> = new Map();
    private lastControllerDragging: Map<WebXRInputSource, Vector3> = new Map();
    private controllerDraggingMesh: Map<WebXRInputSource, Nullable<AbstractMesh>> = new Map();
    private pointerDragBehaviors: Array<PointerDragBehavior> = [];
    private isSqueezing: boolean = false;
    private isTrigger: boolean = false;
    private moveObserver: Observer<Scene>;
    private squeezeObserver: Observer<WebXRControllerComponent>;
    private triggerObserver: Observer<WebXRControllerComponent>;
    private debugRayHelper: RayHelper;

    public configure(): void {
        if (!this.xrExperience) {
            throw new Error(
                "Tried to configure XR interaction without an XR experience."
            );
        }

        for (let cylinderName of this.cylinderNames) {
            const mesh = this.scene.getMeshByName(cylinderName);
            if (mesh) {
                const interactableBehavior = mesh.getBehaviorByName("Interactable") as Nullable<InteractableBehavior>;
                if (interactableBehavior) {
                    interactableBehavior.moveAttached = false;
                }

                let pointerDragBehavior = mesh.getBehaviorByName("PointerDrag") as Nullable<PointerDragBehavior>;
                if (pointerDragBehavior) {
                    // pointerDragBehavior.onDragStartObservable.clear();
                    // pointerDragBehavior.onDragEndObservable.clear();
                    // pointerDragBehavior.onDragObservable.clear();

                    pointerDragBehavior.moveAttached = false;

                    this.pointerDragBehaviors.push(pointerDragBehavior);
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
        console.log("Configure controller");
        this.controllerDragging.set(controller, false);
        this.lastControllerDragging.set(controller, Vector3.Zero());

        if (controller.motionController) {
            this.configureMotionController(controller.motionController, controller.pointer.uniqueId, controller);
        }
        controller.onMotionControllerInitObservable.add((motionController) => {
            this.configureMotionController(motionController, controller.pointer.uniqueId, controller);
        });

        this.moveObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.draggingWithSqueeze) {
                for (let entry of this.controllerDragging) {
                    if (entry[1]) {
                        let controller = entry[0];
                        if (controller.pointer && controller.pointer.position) {
                            const currentControllerPos = controller.pointer.position;
                            const delta = currentControllerPos.subtract(this.lastControllerDragging.get(controller));

                            let mesh = this.controllerDraggingMesh.get(controller);
                            // if (mesh) {
                            //     // mesh.position.addInPlace(delta);
                            //     mesh.moveWithCollisions(delta);
                            // }

                            this.lastControllerDragging.set(controller, currentControllerPos.clone());

                            let pointerDragBehavior = mesh.getBehaviorByName("PointerDrag") as PointerDragBehavior;
                            if (pointerDragBehavior) {
                                pointerDragBehavior.onDragObservable.notifyObservers({
                                    delta: delta.clone(),
                                    dragDistance: delta.length(),
                                    dragPlanePoint: mesh.position,
                                    pointerId: controller.pointer.uniqueId,
                                    pointerInfo: null,
                                    dragPlaneNormal: Vector3.Zero()
                                });
                            }
                        }
                    }
                }
            }
        });
    };

    private updatePointerDragEnabled = () => {
        for (let sixDofDragBehavior of this.pointerDragBehaviors) {
            sixDofDragBehavior.moveAttached = !(this.isSqueezing || this.isTrigger);
        }
    }

    private configureMotionController = (
        motionController: WebXRAbstractMotionController,
        anchorId: number,
        controller: WebXRInputSource,
    ) => {
        console.log("Configure motion controller");
        const squeeze = motionController.getComponentOfType("squeeze");
        if (squeeze) {
            let pointerDragBehavior: Nullable<PointerDragBehavior>;
            let wasPressed: boolean = false;

            if (!this.squeezeObserver) {
                this.squeezeObserver = squeeze.onButtonStateChangedObservable.add(() => {
                    if (squeeze.changes.pressed) {
                        this.findGrabAndNotify(squeeze.pressed, anchorId);
                    }

                    if (squeeze.value >= 0.7) {
                        let pointer = controller.pointer;
                        let pointerPos = pointer.absolutePosition;
                        let dir = pointer.forward;
                        let ray = new Ray(pointerPos, dir, 0.2);

                        const pickInfo = this.scene.pickWithRay(ray);

                        if (pickInfo && pickInfo.hit) {
                            this.isSqueezing = true;
                            wasPressed = true;

                            const intersectMesh = pickInfo.pickedMesh;

                            let parentMesh = intersectMesh;

                            while (parentMesh.parent) {
                                parentMesh = parentMesh.parent as AbstractMesh;
                            }

                            pointerDragBehavior = parentMesh.getBehaviorByName("PointerDrag") as PointerDragBehavior;
                            if (pointerDragBehavior) {
                                pointerDragBehavior.onDragStartObservable.notifyObservers({
                                    pointerId: controller.pointer.uniqueId,
                                    pointerInfo: null,
                                    dragPlanePoint: parentMesh.position
                                });
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
                        if (pointerDragBehavior) {
                            pointerDragBehavior.onDragEndObservable.notifyObservers({
                                pointerId: controller.pointer.uniqueId,
                                pointerInfo: null,
                                dragPlanePoint: this.controllerDraggingMesh.get(controller).position.clone()
                            });
                        }
                        this.controllerDraggingMesh.set(controller, null);
                        this.updatePointerDragEnabled();
                    } else {
                        this.isSqueezing = false;
                        this.updatePointerDragEnabled();
                    }
                });
            }
        } else {
            console.log("Squeeze component not found on motion controller.");
        }

        const trigger = motionController.getMainComponent();
        if (trigger) {
            if (!this.triggerObserver) {
                this.triggerObserver = trigger.onButtonStateChangedObservable.add(() => {
                    if (trigger.value > 0) {
                        this.isTrigger = true;
                    } else {
                        this.isTrigger = false;
                    }
                    if (trigger.changes.pressed) {
                        this.checkActivate(trigger.pressed, anchorId);
                    }
                    this.updatePointerDragEnabled();
                });
            }
        } else {
            console.log("Main component not found on motion controller.");
        }
    }

    public dispose() {
        console.log("Dispose called");
        // this.squeezeObserver.remove();
        // this.triggerObserver.remove();
        // this.moveObserver.remove();

        // this.debugRayHelper.hide();
        // this.debugRayHelper.dispose();
    }
}

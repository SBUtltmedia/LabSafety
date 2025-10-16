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
        console.log("Configuring XR interactions");
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
        for (let pointerDrag of this.pointerDragBehaviors) {
            pointerDrag.moveAttached = !(this.isSqueezing || this.isTrigger);
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
            let rayHelper: RayHelper;
            if (!this.squeezeObserver) {
                this.squeezeObserver = squeeze.onButtonStateChangedObservable.add(() => {
                    let pointer = controller.pointer;
                    let pointerPos = pointer.absolutePosition;
                    let dir = pointer.forward;
                    console.log("Casting ray", pointer.uniqueId, pointerPos, dir);
                    let ray = new Ray(pointerPos, dir, 0.3);

                    rayHelper = new RayHelper(ray);
                    rayHelper.show(this.scene, new Color3(0,1,0));

                    const pickInfo = this.scene.pickWithRay(ray);

                    if (squeeze.changes.pressed && pickInfo && pickInfo.hit) {
                        console.log("Find Grab And Notify");
                        this.findGrabAndNotify(squeeze.pressed, anchorId);
                    }

                    if (squeeze.value >= 0.7 && pickInfo && pickInfo.hit) {
                        console.log("Pick Info Hit!!");
                        this.isSqueezing = true;
                        wasPressed = true;

                        const intersectMesh = pickInfo.pickedMesh;

                        let parentMesh = intersectMesh;

                        while (parentMesh.parent) {
                            parentMesh = parentMesh.parent as AbstractMesh;
                        }

                        console.log("Parent mesh: ", parentMesh.name);

                        pointerDragBehavior = parentMesh.getBehaviorByName("PointerDrag") as PointerDragBehavior;
                        if (pointerDragBehavior) {
                            console.log("Grab pointer unique id: ", pointer.uniqueId);
                            if (pointer && pointer.uniqueId) {
                                // The pointer object exists, so we can safely access its properties.
                                console.log("Pointer drag: ", pointerDragBehavior.name);
                                pointerDragBehavior.onDragStartObservable.notifyObservers({
                                    pointerId: pointer.uniqueId,
                                    pointerInfo: null,
                                    dragPlanePoint: parentMesh.position
                                });
                                this.draggingWithSqueeze = true;
                                this.controllerDragging.set(controller, true);
                                this.lastControllerDragging.set(controller, controller.pointer.position.clone());
                                this.controllerDraggingMesh.set(controller, parentMesh);                                
                            } else {
                                // Optional: Log a warning so you know when this happens
                                console.warn("Attempted to start a drag, but the pointer object was null or undefined.");
                            }
                        }
                    } else if (wasPressed && squeeze.changes.value.current < 0.7) {
                        this.isSqueezing = false;
                        wasPressed = false;
                        this.draggingWithSqueeze = false;
                        if (pointerDragBehavior) {
                            console.log("Drop pointer unique id: ", pointer.uniqueId);
                            if (pointer && pointer.uniqueId) {
                                pointerDragBehavior.onDragEndObservable.notifyObservers({
                                    pointerId: controller.pointer.uniqueId,
                                    pointerInfo: null,
                                    dragPlanePoint: this.controllerDraggingMesh.get(controller).position.clone()
                                });
                            }
                        }
                        if (rayHelper) {
                            rayHelper.dispose();
                            rayHelper = null;
                        }
                        this.controllerDraggingMesh.set(controller, null);
                        this.controllerDragging.set(controller, false);
                        this.updatePointerDragEnabled();
                    } else {
                        if (rayHelper) {
                            rayHelper.dispose();
                            rayHelper = null;
                        }
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

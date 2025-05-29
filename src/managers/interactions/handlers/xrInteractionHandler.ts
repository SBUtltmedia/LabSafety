import { WebXRDefaultExperience, Scene, AbstractMesh, Nullable, PointerDragBehavior, WebXRInputSource, WebXRAbstractMotionController } from "@babylonjs/core";
import { InteractableBehavior } from "../../../behaviors/interactableBehavior";
import { BaseInteractionHandler, IModeSelectorMap, InteractionMode, IMeshGrabInfo, IMeshActivationInfo } from "./baseInteractionHandler";

export class XRInteractionHandler extends BaseInteractionHandler {
    private configured = false;
    private xrExperience: WebXRDefaultExperience;

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
        if (this.configured) {
            return;
        }

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
                    interactableBehavior.moveAttached = true;
                }

                const pointerDragBehavior = mesh.getBehaviorByName("PointerDrag") as Nullable<PointerDragBehavior>;
                if (pointerDragBehavior) {
                    pointerDragBehavior.enabled = false;
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
        if (controller.motionController) {
            this.configureMotionController(controller.motionController, controller.pointer.uniqueId);
        }
        controller.onMotionControllerInitObservable.add((motionController) => {
            this.configureMotionController(motionController, controller.pointer.uniqueId);
        });
    };

    private configureMotionController = (
        motionController: WebXRAbstractMotionController,
        anchorId: number
    ) => {
        const squeeze = motionController.getComponentOfType("squeeze");
        if (squeeze) {
            squeeze.onButtonStateChangedObservable.add(() => {
                if (squeeze.changes.pressed) {
                    console.log("Checking squeeze");
                    this.findGrabAndNotify(squeeze.pressed, anchorId);
                }
            });
        } else {
            console.log("Squeeze component not found on motion controller.");
        }

        const select = motionController.getMainComponent();
        if (select) {
            select.onButtonStateChangedObservable.add(() => {
                if (select.changes.pressed) {
                    this.checkActivate(select.pressed, anchorId);
                }
            });
        } else {
            console.log("Main component not found on motion controller.");
        }
    };
}

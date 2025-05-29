import { PointerInput, PointerEventTypes } from "@babylonjs/core";
import { meshesLoaded } from "../../../scene";
import { BaseInteractionHandler, InteractionMode } from "./baseInteractionHandler";

export class DesktopInteractionHandler extends BaseInteractionHandler {
    private configured = false;

    public configure(): void {
        if (this.configured) {
            return;
        }

        meshesLoaded.add((loaded) => {
            if (loaded) {
                this.setupCylinderInteractions();
                this.setupClickableObjectInteractions();
                this.setupKeyboardInteraction();
            }
        });

        this.scene.onPointerObservable.add((pointerInfo) => {
            if (this.interactionMode === InteractionMode.DESKTOP) { // Ensure this is only active in desktop mode
                if (pointerInfo.event.inputIndex === PointerInput.RightClick) {
                    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                        this.checkActivate(true, this.anchor.uniqueId);
                    } else if (
                        pointerInfo.type === PointerEventTypes.POINTERUP
                    ) {
                        this.checkActivate(false, this.anchor.uniqueId);
                    }
                }
            }
        });

        this.configured = true;
    }
}
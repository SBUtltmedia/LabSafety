import { PointerInput, PointerEventTypes } from "@babylonjs/core";
import { BaseInteractionHandler, InteractionMode } from "./baseInteractionHandler";
import { sceneLoadedObservable } from "../../scene/SceneManager";

export class DesktopInteractionHandler extends BaseInteractionHandler {
    private configured = false;

    public configure(): void {
        if (this.configured) {
            return;
        }

        // Make the XR hand models invisible
        sceneLoadedObservable.add((loaded) => {
            if (loaded) {
                this.scene.getMeshByName("left").isVisible = false;
                this.scene.getMeshByName("right").isVisible = false;
            }
        })
        
        this.setupClickableObjectInteractions();
        this.setupKeyboardInteraction();    

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
                    pointerInfo.event.preventDefault();
                }
            }
        });

        this.configured = true;
    }

    public dispose(): void {
        console.log("Disposing...");
    }
}
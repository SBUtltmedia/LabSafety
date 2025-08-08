import { GUIButtons } from "../../../entities/InteractableButtons";
import { sceneLoadedObservable } from "../../scene/SceneManager";
import { BaseInteractionHandler } from "./baseInteractionHandler";

export class MobileInteractionHandler extends BaseInteractionHandler {
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

        let activateButton = GUIButtons(false);

        activateButton.onPointerDownObservable.add(() => {
            this.checkActivate(true, this.anchor.uniqueId);
        });
        activateButton.onPointerUpObservable.add(() => {
            this.checkActivate(false, this.anchor.uniqueId);
        });

        this.configured = true;
    }

    public dispose(): void {
        console.log("Dispose called");
    }
}
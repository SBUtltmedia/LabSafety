import { meshesLoaded, activateButton } from "../../../scene";
import { BaseInteractionHandler } from "./baseInteractionHandler";

export class MobileInteractionHandler extends BaseInteractionHandler {
    private configured = false;

    public configure(): void {
        if (this.configured) {
            return;
        }

        meshesLoaded.add((loaded) => {
            if (loaded) {
                this.setupCylinderInteractions();
                this.setupClickableObjectInteractions();
            }
        });

        // Specific mobile activation logic
        if (activateButton) {
            activateButton.onPointerDownObservable.add(() => {
                this.checkActivate(true, this.anchor.uniqueId);
            });
            activateButton.onPointerUpObservable.add(() => {
                this.checkActivate(false, this.anchor.uniqueId);
            });
        }

        this.configured = true;
    }
}
import { Control } from "@babylonjs/gui/2D/controls/control";
import { makeThumbArea } from "./virtualTouchJoystick";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";


export const GUIButtons = (isRight = true) => {
	let adt = AdvancedDynamicTexture.CreateFullscreenUI("UI");
	let actionButton = makeThumbArea("action", 0, "blue", "white");
	actionButton.height = "60px";
	actionButton.width = "60px";
	actionButton.isPointerBlocker = true;

    if (isRight) {
	    actionButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    } else {
	    actionButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    }

	actionButton.isVisible = true;
    actionButton.alpha = 0.4;

    let sideJoystickOffset = 100;
	let bottomJoystickOffset = -50;

    if (isRight) {
        actionButton.leftInPixels -= sideJoystickOffset;
    } else {
        actionButton.leftInPixels -= -sideJoystickOffset;
    }
    actionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    actionButton.top = -bottomJoystickOffset;

    actionButton.onPointerDownObservable.add(() => {
        actionButton.background = "gray";
    })

    actionButton.onPointerUpObservable.add(() => {
        actionButton.background = "white";
    })

    adt.addControl(actionButton);

    return actionButton;
};

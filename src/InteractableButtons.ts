import { Control } from "@babylonjs/gui/2D/controls/control";
import { makeThumbArea } from "./VirtualTouchJoystick";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";


export const GUIButtons = (isRight = true) => {
	let adt = AdvancedDynamicTexture.CreateFullscreenUI("UI");
	let actionButton = makeThumbArea("action", 0, "blue", "white");
	actionButton.height = "60px";
	actionButton.width = "60px";
	actionButton.isPointerBlocker = true;

    console.log(Control.HORIZONTAL_ALIGNMENT_RIGHT);

    if (isRight) {
	    actionButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    } else {
	    actionButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    }
	// actionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
	actionButton.isVisible = true;
    actionButton.alpha = 0.4;

    let sideJoystickOffset = 150;
	let bottomJoystickOffset = -50;

    if (isRight) {
        actionButton.leftInPixels -= sideJoystickOffset;
    } else {
        actionButton.leftInPixels -= -sideJoystickOffset;
    }
    actionButton.top = bottomJoystickOffset;

    // actionButton.left = -rightThumbContainer.left;
    // actionButton.top = rightThumbContainer.top;
    // actionButton.setPadding()  

    adt.addControl(actionButton);

    return actionButton;
};
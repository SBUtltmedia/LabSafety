import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";  
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Ellipse } from "@babylonjs/gui";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { GUIButtons } from "./InteractableButtons";

export let rightThumbContainer: Ellipse;

export const enableTouchJoysticks = (scene: Scene) => {
	let adt = AdvancedDynamicTexture.CreateFullscreenUI("UI");
	let xAddPos = 0;
	let yAddPos = 0;
	let xAddRot = 0;
	let yAddRot = 0;
	let sideJoystickOffset = 150;
	let bottomJoystickOffset = -50;
	let translateTransform;

	let rightPuckDown = false;

	const speedFactor = 0.5;

	rightThumbContainer = makeThumbArea("rightThumb", 2, "red", null);
	rightThumbContainer.height = "120px";
	rightThumbContainer.width = "120px";
	rightThumbContainer.isPointerBlocker = true;
	rightThumbContainer.horizontalAlignment =
		Control.HORIZONTAL_ALIGNMENT_RIGHT;
	rightThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
	rightThumbContainer.alpha = 0.4;
	rightThumbContainer.left = -sideJoystickOffset;
	rightThumbContainer.top = bottomJoystickOffset;

	let rightInnerThumbContainer = makeThumbArea(
		"rightInnterThumb",
		4,
		"red",
		null
	);
	rightInnerThumbContainer.height = "50px";
	rightInnerThumbContainer.width = "50px";
	rightInnerThumbContainer.isPointerBlocker = true;
	rightInnerThumbContainer.horizontalAlignment =
		Control.HORIZONTAL_ALIGNMENT_CENTER;
	rightInnerThumbContainer.verticalAlignment =
		Control.VERTICAL_ALIGNMENT_CENTER;

	let rightPuck = makeThumbArea("rightPuck", 0, "red", "red");
	rightPuck.height = "10px";
	rightPuck.width = "10px";
	rightPuck.isPointerBlocker = true;
	rightPuck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
	rightPuck.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

	rightThumbContainer.onPointerDownObservable.add(function (coordinates: {
		x: number;
		y: number;
	}) {
		rightPuck.isVisible = true;
		rightPuck.left =
			adt.getContext().canvas.width -
			coordinates.x -
			rightThumbContainer._currentMeasure.width * 0.5 -
			sideJoystickOffset;
		rightPuck.left = rightPuck.left * -1;
		rightPuck.top =
			adt.getContext().canvas.height -
			coordinates.y -
			rightThumbContainer._currentMeasure.height * 0.5 +
			bottomJoystickOffset;
		rightPuck.top = rightPuck.top * -1;
		rightPuckDown = true;
		rightThumbContainer.alpha = 0.9;
	});

	rightThumbContainer.onPointerUpObservable.add(function (coordinates: any) {
		xAddRot = 0;
		yAddRot = 0;
		rightPuckDown = false;
		rightPuck.isVisible = false;
		rightThumbContainer.alpha = 0.4;
	});

	rightThumbContainer.onPointerMoveObservable.add(function (coordinates: {
		x: number;
		y: number;
	}) {
		if (rightPuckDown) {
			xAddRot =
				adt.getContext().canvas.width -
				coordinates.x -
				rightThumbContainer._currentMeasure.width * 0.5 -
				sideJoystickOffset;
			yAddRot =
				adt.getContext().canvas.height -
				coordinates.y -
				rightThumbContainer._currentMeasure.height * 0.5 +
				bottomJoystickOffset;
			rightPuck.left = xAddRot * -1;
			rightPuck.top = yAddRot * -1;
			rightPuck.left = rightPuck.left;
			rightPuck.top = rightPuck.top;
		}
	});

	//leftThumbContainer.left = 50;
	adt.addControl(rightThumbContainer);
	rightThumbContainer.addControl(rightInnerThumbContainer);
	rightThumbContainer.addControl(rightPuck);
	rightPuck.isVisible = false;

	let camera: UniversalCamera = scene.activeCamera as UniversalCamera;
	let canvas = document.getElementById("canvas");

	camera.attachControl(canvas, true);

	scene.registerBeforeRender(function () {
		translateTransform = Vector3.TransformCoordinates(
			new Vector3(xAddPos / 3000, 0, yAddPos / 3000),
			Matrix.RotationY(camera.rotation.y)
		);
		camera.cameraDirection.addInPlace(translateTransform);
		camera.cameraRotation.y += ((speedFactor * xAddRot) / 15000) * -1;
		camera.cameraRotation.x += ((speedFactor * yAddRot) / 15000) * -1;
	});


};

export function makeThumbArea(
    name: string,
    thickness: number,
    color: string,
    background: string
) {
    let ellipse = new Ellipse();
    ellipse.name = name;
    ellipse.thickness = thickness;
    ellipse.color = color;
    ellipse.background = background;
    ellipse.paddingLeft = "0px";
    ellipse.paddingRight = "0px";
    ellipse.paddingTop = "0px";
    ellipse.paddingBottom = "0px";
    return ellipse;
}

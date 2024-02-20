import { BaseCameraPointersInput } from "@babylonjs/core/Cameras/Inputs/BaseCameraPointersInput";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { EngineStore } from "@babylonjs/core/Engines/engineStore";
import { Matrix, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { DeepImmutableObject, Nullable } from "@babylonjs/core/types";
import { PointerTouch } from "@babylonjs/core/Events/pointerEvents";


export class VirtualTouchJoystick extends BaseCameraPointersInput {
    SWIPE_SENSIBILITY = 0.5;
    JOYSTICK_COLOR = "LightGray";
    JOYSTICK_TOUCH_AREA_HORIZONTAL_SCREEN_SHARE = 0.5;
    JOYSTICK_CIRCLE_SIZE_VERTICAL_SCREEN_SHARE = 0.1;
    JOYSTICK_PUCK_SIZE_VERTICAL_SCREEN_SHARE = 0.05;
    JOYSTICK_OUTER_CIRCLE_THICKNESS_RATIO = 0.01;
    JOYSTICK_INNER_CIRCLE_THICKNESS_RATIO = 0.04;
    JOYSTICK_PUCK_THICKNESS_RATIO = 0.01;

    camera: UniversalCamera;
    joystickDelta = Vector2.Zero();
    screenSize: Vector2;
    ui: AdvancedDynamicTexture;
    joystickPointerId: number;
    joystickButtonDownPos: Vector2;
    joystickButtonDownPosOffset: DeepImmutableObject<Vector2>;
    joystickContainer: Container;
    joystickOuterCirce: Ellipse;
    joystickInnerCircle: Ellipse;
    joystickPuck: Ellipse;
    joystickCircleRadius: number;
    joystickPuckRadius: number;

    // constructor(isLeftHand: boolean = true) {
    //     super();
        
    // }

    getClassName = () => this.constructor.name;

    getSimpleName = () => "joystick"

    attachControl(noPreventDefault?: boolean) {
        super.attachControl(noPreventDefault);
        this.screenSize = VirtualTouchJoystick.getScreenSize();
        this.ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.prepareImages();
        EngineStore.LastCreatedEngine.onResizeObservable.add(this.resize);
    }

    prepareImages() {
        this.joystickCircleRadius = this.screenSize.y * this.JOYSTICK_CIRCLE_SIZE_VERTICAL_SCREEN_SHARE;
        this.joystickPuckRadius = this.screenSize.y * this.JOYSTICK_PUCK_SIZE_VERTICAL_SCREEN_SHARE;

        this.joystickContainer = new Container("virtual_joystick");
        let containerSize = this.joystickCircleRadius * 2 + this.joystickPuckRadius * 2 + 1;
        this.joystickContainer.widthInPixels = containerSize;
        this.joystickContainer.heightInPixels = containerSize;
        this.joystickContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.joystickContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this.joystickOuterCirce = this.prepareJoystickCircle(
            this.joystickCircleRadius,
            containerSize * this.JOYSTICK_OUTER_CIRCLE_THICKNESS_RATIO,
        );
        this.joystickInnerCircle = this.prepareJoystickCircle(
            this.joystickPuckRadius,
            containerSize * this.JOYSTICK_INNER_CIRCLE_THICKNESS_RATIO,
        );
        this.joystickPuck = this.prepareJoystickCircle(
            this.joystickPuckRadius,
            containerSize * this.JOYSTICK_PUCK_THICKNESS_RATIO,
        );

        this.joystickContainer.addControl(this.joystickOuterCirce);
        this.joystickContainer.addControl(this.joystickInnerCircle);
        this.joystickContainer.addControl(this.joystickPuck);
        this.joystickContainer.isVisible = false;
        this.ui.addControl(this.joystickContainer);
    }

    prepareJoystickCircle(radius: number, thickness: number) {
        let circle = new Ellipse();
        circle.widthInPixels = radius * 2;
        circle.heightInPixels = radius * 2;
        circle.thickness = thickness;
        circle.color = this.JOYSTICK_COLOR;
        circle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        circle.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        return circle;
    }

    detachControl() {
        this.disposeImages();
        this.ui.dispose();
        EngineStore.LastCreatedEngine.onResizeObservable.removeCallback(this.resize);
        super.detachControl();
    }

    disposeImages() {
        this.joystickContainer.dispose()
        this.joystickInnerCircle.dispose();
        this.joystickOuterCirce.dispose();
        this.joystickPuck.dispose();
    }

    resize = () => {
        this.screenSize = VirtualTouchJoystick.getScreenSize();
        this.disposeImages();
        this.prepareImages();
    };

    static getScreenSize() {
        let engine = EngineStore.LastCreatedEngine;
        return new Vector2(engine.getRenderWidth(), engine.getRenderHeight());
    }

    checkInputs() {
        let joystickMoveVector = new Vector3(this.joystickDelta.x, 0, -this.joystickDelta.y);
        joystickMoveVector.scaleInPlace(EngineStore.LastCreatedEngine.getDeltaTime() / 1000);
        this.camera.cameraDirection.addInPlace(
            Vector3.TransformCoordinates(joystickMoveVector, Matrix.RotationY(this.camera.rotation.y)),
        );
    }

    onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number) {
        if (point.pointerId === this.joystickPointerId) {
            // point refer to global inner window canvas, we need to convert it to local render canvas
            this.onTouchJoystick(
                new Vector2(point.x, point.y).subtractInPlace(this.joystickButtonDownPosOffset),
            );
        } else {
            this.onTouchSwipe(new Vector2(offsetX, offsetY));
        }
    }

    onTouchJoystick(touchPoint: Vector2) {
        const joystickVector = touchPoint.subtract(this.joystickButtonDownPos);
        if (joystickVector.length() > this.joystickCircleRadius)
            joystickVector.scaleInPlace(this.joystickCircleRadius / joystickVector.length());
        this.joystickPuck.left = joystickVector.x;
        this.joystickPuck.top = joystickVector.y;

        this.joystickDelta = joystickVector.scaleInPlace(this.camera.speed / this.joystickCircleRadius);
    }

    onTouchSwipe(touchOffset: Vector2) {
        let directionAdjust = 1;
        if (this.camera.getScene().useRightHandedSystem) directionAdjust *= -1;
        if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0)
            directionAdjust *= -1;

        this.camera.cameraRotation.y +=
            ((directionAdjust * touchOffset.x) / this.screenSize.x) * this.SWIPE_SENSIBILITY;
        this.camera.cameraRotation.x += (touchOffset.y / this.screenSize.x) * this.SWIPE_SENSIBILITY;
    }

    onButtonDown(evt: { offsetX: number; }) {
        if (evt.offsetX < this.screenSize.x * this.JOYSTICK_TOUCH_AREA_HORIZONTAL_SCREEN_SHARE) {
            this.onButtonDownJoystick(evt);
        }
    }

    onButtonDownJoystick(evt: { offsetX: number; offsetY?: number; pointerId?: number; clientX?: number; clientY?: number; }) {
        let point = new Vector2(evt.offsetX, evt.offsetY);
        this.joystickPointerId = evt.pointerId;
        this.joystickButtonDownPos = point;
        this.joystickButtonDownPosOffset = new Vector2(evt.clientX - point.x, evt.clientY - point.y);
        this.joystickContainer.left = point.x - this.joystickContainer.widthInPixels / 2;
        this.joystickContainer.top = point.y - this.joystickContainer.heightInPixels / 2;
        this.joystickContainer.isVisible = true;
    }

    onButtonUp(evt: { pointerId: number; }) {
        if (evt.pointerId === this.joystickPointerId) this.onButtonUpJoystick();
    }

    onButtonUpJoystick() {
        this.joystickPointerId = null;
        this.joystickDelta.scaleInPlace(0);
        this.joystickContainer.isVisible = false;
    }
}

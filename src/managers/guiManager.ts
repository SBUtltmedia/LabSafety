import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { disablePointerLock } from "../scene";

class PromptWithButton {
    rect: Rectangle;
    text: TextBlock;
    button: Button;

    constructor(rect: Rectangle, text: TextBlock, button: Button) {
        this.rect = rect;
        this.text = text;
        this.button = button;
    }

    setVisible(visible = true) {
        this.rect.isVisible = visible;
        this.text.isVisible = visible;
        this.button.isVisible = visible;
        document.exitPointerLock();
        disablePointerLock();
    }
}

export class GUIManager {
    advancedTexture: AdvancedDynamicTexture;
    welcomePrompt: PromptWithButton;
    gameFinishPrompt: PromptWithButton;
    camera: Camera;
    screen: Mesh;
    scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
        this.camera = scene.activeCamera;
    }

    createPromptWithButton(
        text: string,
        buttonClickCallBack: any = null,
        ...args: any[]
    ) {
        this.screen = MeshBuilder.CreatePlane("Start", { size: 1 });
        this.screen.parent = this.camera;

        // need to add a vector because the origin of the camera is at top left
        this.screen.position = new Vector3(0, 0, 0.5);
        this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(
            this.screen
        );

        let container = new Container("container");
        var rect1 = new Rectangle();
        rect1.width = 0.5;
        rect1.height = 0.2;
        rect1.color = "cyan";
        rect1.thickness = 4;
        rect1.background = "white";
        container.addControl(rect1);

        var text1 = new TextBlock();
        text1.text = text;
        text1.color = "black";
        text1.fontSize = "17px";
        text1.resizeToFit = true;
        text1.textWrapping = true;

        text1.paddingBottomInPixels = 40;
        text1.paddingLeftInPixels = 15;
        text1.paddingRightInPixels = 15;

        rect1.addControl(text1);

        var button1 = Button.CreateSimpleButton("but1", "Click to dismiss");
        button1.width = "150px";
        button1.height = "40px";
        button1.color = "black";
        button1.cornerRadius = 20;
        button1.background = "white";
        button1.topInPixels = 40;
        let prompt = new PromptWithButton(rect1, text1, button1);

        let mesh = (this.scene as Scene).getMeshByName("Start");

        function pointerUp() {
            container.dispose();
            mesh.dispose();
            if (buttonClickCallBack) {
                buttonClickCallBack(...args);
            }
        }

        prompt.button.onPointerUpObservable.add(function () {
            pointerUp();
        });
        prompt.button.onPointerEnterObservable.add(() => {
            button1.background = "grey";
        });
        prompt.button.onPointerOutObservable.add(() => {
            button1.background = "white";
        });
        container.addControl(prompt.button);
        container.addControl(button1);

        this.advancedTexture.addControl(container);

        return prompt;
    }
}

export class GUIWindows {
    static createWelcomeScreen(
        scene: Scene
    ) {
        let guiManager = new GUIManager(scene);
        let prompt = guiManager.createPromptWithButton(
            "Welcome to the game. Please click on the clipboard on the table to get started.",
        );
        prompt.setVisible(true);
    }

    static createSuccessScreen(
        scene: Scene,
        buttonClickCallBack: Nullable<() => void> = null,
        ...args: any[]
    ) {
        let guiManager = new GUIManager(scene);
        let prompt = guiManager.createPromptWithButton(
            "Congratulations! You have completed the SOP",
            buttonClickCallBack,
            ...args
        );
        prompt.setVisible(true);
    }

    static createFailureScreen(
        scene: Scene,
        buttonClickCallBack: Nullable<() => void> = null,
        ...args: any[]
    ) {
        let guiManager = new GUIManager(scene);
        let prompt = guiManager.createPromptWithButton(
            "You successfully extinguished the fire! Try mixing the chemicals again.",
            buttonClickCallBack,
            ...args
        );
        prompt.setVisible(true);
    }
}

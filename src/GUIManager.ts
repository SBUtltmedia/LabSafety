import { AdvancedDynamicTexture, Rectangle, TextBlock, Button, Container } from "@babylonjs/gui"
import { Camera, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core"

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
      console.log("Scene: ", this.scene);
    }

    createPromptWithButton(text: string, xrCamera = null, buttonClickCallBack = null, ...args) {
        this.screen = MeshBuilder.CreatePlane("Start", { size: 1 });
        this.screen.parent = this.camera;
        this.screen.position = this.camera.position.add(new Vector3(.7, -2, 2.5));
        this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.screen);

        let container = new Container("container");
        var rect1 = new Rectangle();
        rect1.width = 0.50;
        rect1.height = 0.20;
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
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "black";
        button1.cornerRadius = 20;
        button1.background = "white";
        button1.topInPixels = 40;
        let prompt = new PromptWithButton(rect1, text1, button1);

        let mesh = (this.scene as Scene).getMeshByName("Start");

        prompt.button.onPointerUpObservable.add(function () {
          container.dispose();
          mesh.dispose();
          console.log("XR cam: ", xrCamera);
          if (xrCamera) {
            console.log("Hiding Pointer!");
            xrCamera.pointerSelection.displayLaserPointer = false;
            xrCamera.pointerSelection.displaySelectionMesh = false;
          }
          if (buttonClickCallBack) {
            buttonClickCallBack(...args);
          }
        });
        prompt.button.onPointerEnterObservable.add(() => {
            button1.background = "grey";
        })
        prompt.button.onPointerOutObservable.add(() => {
            button1.background = "white";
        })
        container.addControl(prompt.button);
        container.addControl(button1);

        this.advancedTexture.addControl(container);

        return prompt;
    }
}
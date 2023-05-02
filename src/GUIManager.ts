import { AdvancedDynamicTexture, Rectangle, TextBlock, Button } from "@babylonjs/gui"
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
    constructor(scene: Scene) {
        this.camera = scene.activeCamera;
        this.screen = MeshBuilder.CreatePlane("Start", { size: .5 });
        this.screen.parent = this.camera;
        this.screen.position = this.camera.position.add(new Vector3(.7, -2, 2.5));
        this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.screen);
        const button1 = Button.CreateSimpleButton("but1", "Click Me");
        button1.width = 1;
        button1.height = 0.4;
        this.advancedTexture.addControl(button1);
        //this.welcomePrompt = this.createPromptWithButton("Welcome to lab! You can find the tasks for today by clicking on the clipboard.")
        //this.gameFinishPrompt = this.createPromptWithButton("Task successfully completed!");
    }

    createPromptWithButton(text: string) {
        var advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.screen);
        var rect1 = new Rectangle();
        rect1.width = 0.25;
        rect1.height = 0.25;
        rect1.cornerRadius = 20;
        rect1.color = "cyan";
        rect1.thickness = 4;
        rect1.background = "white";
        advancedTexture.addControl(rect1);

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
        prompt.setVisible(false);

        prompt.button.onPointerUpObservable.add(function () {
            prompt.setVisible(false);
        });
        prompt.button.onPointerEnterObservable.add(() => {
            button1.background = "grey";
        })
        prompt.button.onPointerOutObservable.add(() => {
            button1.background = "white";
        })
        advancedTexture.addControl(prompt.button);
        rect1.addControl(button1);

        return prompt;
    }
}

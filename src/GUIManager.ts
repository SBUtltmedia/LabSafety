import { AdvancedDynamicTexture, Rectangle, TextBlock, Button } from "@babylonjs/gui"

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

    constructor() {
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.welcomePrompt = this.createPromptWithButton("Welcome to lab! You can find the tasks for today by clicking on the clipboard.")
        this.gameFinishPrompt = this.createPromptWithButton("Task successfully completed!");
    }

    createPromptWithButton(text: string) {
        var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
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

        prompt.button.onPointerUpObservable.add(function() {
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

import { GameStates } from "./GameStateBehavior";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";

export class GameState {
    text: string;
    advancedTexture: AdvancedDynamicTexture;
    textBlock: TextBlock;
    rectangle: Rectangle;

    constructor(text?: string) {
        if (text)
            this.text = text;

        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("HUD");
        this.textBlock = new TextBlock("textblock");
        this.rectangle = new Rectangle("rect");
        this.rectangle.width = 0.13;
        this.rectangle.height = 0.33
        this.rectangle.color = "cyan";
        this.rectangle.thickness = 4;
        this.rectangle.background = "black";   
        this.rectangle.alpha = 0.5;

        this.rectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.rectangle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        if (newState === GameStates.GAME_STATE_START) {
            this.hideHUD();
            return new StartState("Click to begin!");
        }
        return null;
    }

    displayHUD(): void {
        this.textBlock.text = this.text;
        this.textBlock.textWrapping = true;
        this.textBlock.fontSize = 20;
        
        this.textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this.textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        this.textBlock.paddingTopInPixels = 30;
        this.textBlock.paddingLeftInPixels = 5;

        this.textBlock.alpha = 1;

        this.textBlock.color = "white";
        this.rectangle.addControl(this.textBlock);  
        
        this.textBlock.isVisible = true;
        this.rectangle.isVisible = true;
        this.advancedTexture.addControl(this.rectangle);

    }

    hideHUD(): void {
        this.textBlock.isVisible = false;
        this.rectangle.isVisible = false;
    }
}

export class StartState extends GameState {
    constructor(text: string) {
        super(text);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        this.hideHUD();
        return new BaseState("Use W,A,S,D keys to move\nUse your mouse to look around\nLeft click to interact and right click to use\n\nLeft click on the clipboard to learn more");
    }

    displayHUD(): void {
        let textblock = this.textBlock;
        let advancedTexture = this.advancedTexture;

        textblock.text = this.text;
        textblock.fontSize = 30;
        textblock.fontWeight = "bold";
        textblock.top = -50;
        textblock.color = "white";
        advancedTexture.addControl(textblock);

        textblock.isVisible = true;
    }
}

export class BaseState extends GameState {
    constructor(text: string) {
        super(text);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        if (newState === GameStates.GAME_STATE_PICK_SOP) {
            this.hideHUD();
            return new PickSOPState("Read the instructions carefully and let go of the clipboard to continue!");
        } else if (newState === GameStates.GAME_STATE_PICK_CYLINDER) {
            this.hideHUD();
            return new PickCylinderState("Right click on any of the other cylinders to mix!");
        } else if (newState === GameStates.GAME_STATE_START) {
            this.hideHUD();
            return new StartState("Click to begin!");
        }
        return null;
    }
}

export class PickCylinderState extends GameState {
    constructor(text: string) {
        super(text);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        if (newState === GameStates.GAME_STATE_PASS) {
            this.hideHUD();
            return new PassFailState("You mixed the correct set of cylinders! Read the SOP or continue mixing further to continue!", true);
        } else if (newState === GameStates.GAME_STATE_FAIL) {
            this.hideHUD();
            return new PassFailState("You mixed the wrong chemicals that resulted in a fire! Open the fire extinguisher cabinet and extinguish the fire.");
        } else if (newState === GameStates.GAME_STATE_DROP_CYLINDER) {
            this.hideHUD();
            return new BaseState("Use W,A,S,D keys to move\nUse your mouse to look around\nLeft click to interact and right click to use");
        }
        return null;
    }
}

export class PassFailState extends GameState {
    isPass: boolean;

    constructor(text: string, isPass = false) {
        super(text);
        this.displayHUD();
        this.isPass = isPass;
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        this.hideHUD();
        if (newState === GameStates.GAME_STATE_SOP_PASS) {
            return new BaseState("You have completed the SOP!");
        } else if (newState == GameStates.GAME_STATE_BASE) {
            return new BaseState("Use W,A,S,D keys to move\nUse your mouse to look around\nLeft click to interact and right click to use\n\nLeft click on the clipboard to learn more");
        }
        return new BaseState(this.isPass ? "Read the instructions carefully and let go of the clipboard to continue!" : this.text);
    }
}

export class PickSOPState extends GameState {
    constructor(text: string) {
        super(text);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        this.hideHUD();
        return new BaseState("Read the instructions carefully and let go of the clipboard to continue!");
    }
}
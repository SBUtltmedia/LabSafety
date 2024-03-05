import { GameStates } from "./GameStateBehavior";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { global } from "./GlobalState";

export class GameState {
    text: string;
    advancedTexture: AdvancedDynamicTexture;
    textBlock: TextBlock;
    rectangle: Rectangle;
    platform: string

    constructor(text: string, platform: string) {
        if (text)
            this.text = text;
        
        if (platform)
            this.platform = platform;

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
            return new StartState(global.hudHints["GAME_STATE_START"][this.platform], this.platform);
        }
        return null;
    }

    displayHUD(): void {
        this.textBlock.text = this.text;
        this.textBlock.textWrapping = true;
        this.textBlock.fontSize = 20;

        if (this.platform === "mobile") {
            this.textBlock.fontSize = 12;
        }
        
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
    constructor(text: string, platform: string) {
        super(text, platform);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        this.hideHUD();
        return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
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
    constructor(text: string, platform: string) {
        super(text, platform);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        if (newState === GameStates.GAME_STATE_PICK_SOP) {
            this.hideHUD();
            return new PickSOPState(global.hudHints["GAME_STATE_PICK_SOP"][this.platform], this.platform);
        } else if (newState === GameStates.GAME_STATE_PICK_CYLINDER) {
            this.hideHUD();
            return new PickCylinderState(global.hudHints["GAME_STATE_PICK_CYLINDER"][this.platform], this.platform);
        } else if (newState === GameStates.GAME_STATE_START) {
            this.hideHUD();
            return new StartState(global.hudHints["GAME_STATE_START"][this.platform], this.platform);
        }
        return null;
    }
}

export class PickCylinderState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        if (newState === GameStates.GAME_STATE_PASS) {
            this.hideHUD();
            return new PassFailState(global.hudHints["GAME_STATE_PASS"][this.platform], this.platform, true);
        } else if (newState === GameStates.GAME_STATE_FAIL) {
            this.hideHUD();
            return new PassFailState(global.hudHints["GAME_STATE_FAIL"][this.platform], this.platform);
        } else if (newState === GameStates.GAME_STATE_DROP_CYLINDER) {
            this.hideHUD();
            return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
        }
        return null;
    }
}

export class PassFailState extends GameState {
    isPass: boolean;

    constructor(text: string, platform: string, isPass = false) {
        super(text, platform);
        this.displayHUD();
        this.isPass = isPass;
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        this.hideHUD();
        if (newState === GameStates.GAME_STATE_SOP_PASS) {
            return new BaseState(global.hudHints["GAME_STATE_SOP_PASS"][this.platform], this.platform);
        } else if (newState === GameStates.GAME_STATE_BASE) {
            return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
        }
        return new BaseState(this.isPass ? global.hudHints["GAME_STATE_BASE"][this.platform] : this.text, this.platform);
    }
}

export class PickSOPState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, ...args: any): GameState {
        this.hideHUD();
        return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
    }
}
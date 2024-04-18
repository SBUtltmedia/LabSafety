import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { GameStates } from "./StateMachine";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { global } from "./GlobalState";

import { utilityLayer } from "./scene";

export class GameState {
    text: string;
    advancedTexture: AdvancedDynamicTexture;
    textBlock: TextBlock;
    rectangle: Rectangle;
    #plane: AbstractMesh;
    protected _platform: string;

    set platform(val: string) {
        this._platform = val;
        this.#repositionPlane();
    }

    get platform(): string {
        return this._platform;
    }

    #repositionPlane = (): void => {
        this.#plane.setParent(utilityLayer.originalScene.activeCamera);
        this.#plane.position.copyFromFloats(0, -0.5, 2);
        this.#plane.rotation.setAll(0);
    }

    constructor(text: string, platform: string) {
        if (text)
            this.text = text;
        
        if (platform)
            this._platform = platform;
        this.#plane = CreatePlane("plane", { size: 2 }, utilityLayer.utilityLayerScene);
        this.#plane.isPickable = false;
        this.#repositionPlane();
        this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.#plane);
        // this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("HUD");
        this.textBlock = new TextBlock("textblock");
        this.rectangle = new Rectangle("rect");
        this.rectangle.width = 0.25;
        this.rectangle.height = 0.33;
        this.rectangle.color = "cyan";
        this.rectangle.thickness = 4;
        this.rectangle.background = "black";   
        this.rectangle.alpha = 0.5;

        this.rectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.rectangle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this._platform = platform;
        if (newState === GameStates.START) {
            this.hideHUD();
            return new StartState(global.hudHints["GAME_STATE_START"][this._platform], this._platform);
        }
        return null;
    }

    displayHUD(): void {
        this.textBlock.text = this.text;
        this.textBlock.textWrapping = true;
        this.textBlock.fontSize = 20;

        if (this._platform === "mobile") {
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

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.hideHUD();
        this.platform = platform;
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

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        if (newState === GameStates.GRAB) {
            this.hideHUD();
            return new GrabState(global.hudHints["GAME_STATE_PICK_SOP"][this.platform], this.platform);
        } else if (newState === GameStates.HIGHLIGHT) {
            this.hideHUD();
            return new HighlightState(global.hudHints["GAME_STATE_PICK_CYLINDER"][this.platform], this.platform);
        }
        return null;
    }
}

export class GrabState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        if (newState === GameStates.ACTIVATE) {
            this.hideHUD();
            return new ActivateState(global.hudHints["GAME_STATE_PASS"][this.platform], this.platform);
        } else if (newState === GameStates.BASE) {
            this.hideHUD();
            return new BaseState(global.hudHints["GAME_STATE_FAIL"][this.platform], this.platform);
        }
        return null;
    }
}

export class ActivateState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform);
        // this.displayHUD();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
    }
}


export class HighlightState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        this.hideHUD();
        return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
    }
}
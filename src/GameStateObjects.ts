import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { GameStates } from "./StateMachine";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { global } from "./GlobalState";

import { utilityLayer } from "./scene";

export class GameState {
    text: string;
    advancedTexture: AdvancedDynamicTexture;
    textBlock: TextBlock;
    rectangle: Rectangle;
    #plane: AbstractMesh;
    protected _platform: string;
    currentState: GameStates;

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

    constructor(text: string, platform: string, currentGameState: GameStates) {
        if (text)
            this.text = text;
        
        if (platform)
            this._platform = platform;
        this.#plane = CreatePlane("plane_text", { size: 2 }, utilityLayer.utilityLayerScene);
        this.#plane.isPickable = false;
        this.#repositionPlane();
        this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.#plane);
        this.textBlock = new TextBlock("textblock");
        this.currentState = currentGameState;
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

        this.textBlock.paddingBottomInPixels = 200;

        this.textBlock.alpha = 1;

        this.textBlock.color = "white";
        
        this.textBlock.isVisible = true;
        this.advancedTexture.addControl(this.textBlock);

    }

    hideHUD(): void {
        this.textBlock.isVisible = false;
    }
}

export class StartState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.START);
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
        textblock.color = "white";
        advancedTexture.addControl(textblock);

        textblock.isVisible = true;
    }
}

export class BaseState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.BASE);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        if (newState === GameStates.GRAB) {
            this.hideHUD();
            return new GrabState(global.hudHints["GAME_STATE_PICK_SOP"][this.platform], this.platform);
        } else if (newState === GameStates.PICK) {
            this.hideHUD();
            return new PickState(global.hudHints["GAME_STATE_PICK"][this.platform], this.platform);
        }
        return null;
    }
}

export class GrabState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.GRAB);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        this.hideHUD();
        if (newState === GameStates.LOSE) {
            return new LoseState(global.hudHints["GAME_STATE_FAIL"][this.platform], this.platform);
        }
        return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
    }
}


export class PickState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.PICK);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        if (newState === GameStates.GRAB) {
            this.hideHUD();
            if (args.length > 0) {
                let mesh: AbstractMesh = args[0];
                if (mesh.name === "fire-extinguisher") {
                    return new GrabState(global.hudHints["GAME_STATE_PICK_FIREEXTINGUISHER"][this.platform], this.platform);        
                }
            }
            return new GrabState(global.hudHints["GAME_STATE_PICK_CYLINDER"][this.platform], this.platform);
        } else if (newState === GameStates.BASE) {
            this.hideHUD();
            return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
        }
        return null;
    }    
}

export class LoseState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.PICK);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        if (newState === GameStates.PICK) {
            this.hideHUD();
            return new PickState(global.hudHints["GAME_STATE_PICK"][this.platform], this.platform);
        }
        return this;
    }    
}
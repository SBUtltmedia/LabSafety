import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { GameStates } from "./StateMachine";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { global } from "./GlobalState";
import { Control } from "@babylonjs/gui";

import { utilityLayer } from "./scene";

export class GameState {
    text: string;
    advancedTexture: AdvancedDynamicTexture;
    textBlock: TextBlock;
    rectangle: Rectangle;
    #plane: AbstractMesh;
    protected _platform: string;
    currentState: GameStates;
    displayingHUD: boolean;

    set platform(val: string) {
        this._platform = val;
        // this.#repositionPlane();
    }

    get platform(): string {
        return this._platform;
    }

    #repositionPlane = (): void => {
        this.#plane.setParent(utilityLayer.originalScene.activeCamera);
        this.#plane.position.copyFromFloats(0.1, 1.4, 2);
        this.#plane.rotation.setAll(0);
    }

    constructor(text: string, platform: string, currentGameState: GameStates) {
        if (text)
            this.text = text;
        
        if (platform)
            this._platform = platform;

        this.currentState = currentGameState;

        // this.#plane = CreatePlane("plane_text", { size: 2 }, utilityLayer.utilityLayerScene);
        // this.#plane.isPickable = false;
        // this.#repositionPlane();

        if (this._platform !== "xr") {
            this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("HUD");
        } else {
            this.#plane = CreatePlane("plane_text", { size: 2 }, utilityLayer.utilityLayerScene);
            this.#plane.isPickable = false;
            this.#repositionPlane();
            this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.#plane);
        }

        this.configureGUI();

    }

    configureGUI(): void {
        this.textBlock = new TextBlock("textblock");

        this.textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

        this.rectangle = new Rectangle("rect");
        if (this._platform === "xr") {
            this.rectangle.width = 0.58;
            this.rectangle.height = 0.25;
        } else {
            this.rectangle.width = 0.5;
            this.rectangle.height = 0.2;
        }
        this.rectangle.color = "red";
        this.rectangle.thickness = 4;
        this.rectangle.background = "#333131";   
        // this.rectangle.alpha = 0.5;

        this.rectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.rectangle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.rectangle.paddingBottom = "100px";
        
        this.rectangle.addControl(this.textBlock);
        this.advancedTexture.addControl(this.rectangle);
        this.displayingHUD = false;
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this._platform = platform;
        if (newState === GameStates.BASE) {
            this.hideHUD();
            console.log(global.hudHints["GAME_STATE_BASE"]);
            return new BaseState(global.hudHints["GAME_STATE_BASE"][this._platform], this._platform);
        }
        return null;
    }

    displayHUD(): void {
        this.textBlock.text = this.text;
        this.textBlock.textWrapping = true;
        this.textBlock.fontSize = 22;

        if (this._platform === "mobile") {
            console.log("in mobile mode")
            this.textBlock.fontSize = 11;
            this.rectangle.height = 0.2;
            this.rectangle.paddingBottom = "10px";
            this.textBlock.paddingTop = "5px";
        }

        this.textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this.textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        this.textBlock.paddingLeftInPixels = 10;
        this.textBlock.paddingBottomInPixels = 10;

        this.textBlock.color = "#6bfdff";
        
        this.textBlock.isVisible = true;
        this.rectangle.isVisible = true;
        this.displayingHUD = true;
        console.log("set visible");
        // this.advancedTexture.addControl(this.textBlock);
    }

    hideHUD(): void {
        if (this.rectangle) {
            this.rectangle.isVisible = false;
        }
        if (this.textBlock) {
            this.textBlock.isVisible = false;
        }
        this.displayingHUD = false;
    }

    toggleHUD(): void {
        if (this.displayingHUD) {
            this.hideHUD();
        } else {
            this.displayHUD();
        }
    }

    configureXR(): void {
        this.hideHUD();

        if (this.rectangle) {
            this.rectangle.dispose();
        }
        if (this.textBlock) {
            this.textBlock.dispose();
        }

        this.#plane = CreatePlane("plane_text", { size: 2 }, utilityLayer.utilityLayerScene);
        this.#plane.isPickable = false;
        this.#repositionPlane();
        this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.#plane);
        this.textBlock = new TextBlock("textblock");

        this.configureGUI();

        this._platform = "xr";
        
        this.displayHUD();
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
            if (args.length > 0) {
                let mesh: AbstractMesh = args[0];
                console.log(mesh);
                if (mesh.name === "fire-extinguisher") {
                    return new GrabState(global.hudHints["GAME_STATE_PICK_FIREEXTINGUISHER"][this.platform], this.platform);        
                } else if (mesh.name.startsWith("cylinder")) {
                    return new GrabState(global.hudHints["GAME_STATE_PICK_CYLINDER"][this.platform], this.platform);
                } else if (mesh.name.startsWith("Door")) {
                    return new GrabState("Drag around the door's handle to open it", this.platform);
                }
            }                        
            return new GrabState(global.hudHints["GAME_STATE_PICK"][this.platform], this.platform);
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
            return new FailState(global.hudHints["GAME_STATE_FAIL"][this.platform], this.platform);
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

export class FailState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.PICK);
        this.displayHUD();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        if (newState === GameStates.PICK) {
            this.hideHUD();
            return new PickState(global.hudHints["GAME_STATE_PICK"][this.platform], this.platform);
        } else if (newState === GameStates.START) {
            this.hideHUD();
            return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
        }
        return this;
    }    
}
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { GameStates } from "./StateMachine";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { global } from "./GlobalState";
import { drawBBText } from "./Blackboard";

export class GameState {
    text: string;
    advancedTexture: AdvancedDynamicTexture;
    textBlock: TextBlock;
    rectangle: Rectangle;
    protected _platform: string;
    currentState: GameStates;
    displayingHUD: boolean;

    set platform(val: string) {
        this._platform = val;
    }

    get platform(): string {
        return this._platform;
    }

    constructor(text: string, platform: string, currentGameState: GameStates) {
        if (text)
            this.text = text;
        
        if (platform)
            this._platform = platform;

        this.currentState = currentGameState;

    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this._platform = platform;
        if (newState === GameStates.BASE) {
            console.log(global.hudHints["GAME_STATE_BASE"]);
            return new BaseState(global.hudHints["GAME_STATE_BASE"][this._platform], this._platform);
        }
        return null;
    }

    updateHUDText(): void {
        drawBBText(this.text);
    }

    configureXR(): void {
        this._platform = "xr";
        this.updateHUDText();
    }
}

export class StartState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.START);
        this.updateHUDText();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
    }
}

export class BaseState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.BASE);
        this.updateHUDText();
        this.displayingHUD = true;
        console.log("set visible true");
        console.log("In base state display");
        console.log(this.displayingHUD);
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        if (newState === GameStates.GRAB) {
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
        console.log("In grab state");
        this.updateHUDText();
        this.displayingHUD = true;
        console.log("set visible true");

    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        if (newState === GameStates.LOSE) {
            return new FailState(global.hudHints["GAME_STATE_FAIL"][this.platform], this.platform);
        }
        return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
    }
}


export class PickState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.PICK);
        this.updateHUDText();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        if (newState === GameStates.GRAB) {
            if (args.length > 0) {
                let mesh: AbstractMesh = args[0];
                if (mesh.name === "fire-extinguisher") {
                    return new GrabState(global.hudHints["GAME_STATE_PICK_FIREEXTINGUISHER"][this.platform], this.platform);        
                }
            }
            return new GrabState(global.hudHints["GAME_STATE_PICK_CYLINDER"][this.platform], this.platform);
        } else if (newState === GameStates.BASE) {
            return new BaseState(global.hudHints["GAME_STATE_BASE"][this.platform], this.platform);
        }
        return null;
    }    
}

export class FailState extends GameState {
    constructor(text: string, platform: string) {
        super(text, platform, GameStates.PICK);
        this.updateHUDText();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        return this;
    }    
}
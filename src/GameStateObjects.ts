import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { GameStates } from "./StateMachine";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { global } from "./GlobalState";
import { drawBBText } from "./Blackboard";
import { HudHint, soundMap, platformMap, HUDAudioFiles, HintAudioFiles } from "./setupGameStates";


export class GameState {
    text: string;
    advancedTexture: AdvancedDynamicTexture;
    textBlock: TextBlock;
    rectangle: Rectangle;
    protected _platform: string;
    currentState: GameStates;
    displayingHUD: boolean;
    audioFileName: string;
    howlerAudioObject: Howl;
    playBaseAudioOnce: boolean = true;

    set platform(val: string) {
        this._platform = val;
    }

    get platform(): string {
        return this._platform;
    }

    constructor(hudHint: HudHint, platform: string, currentGameState: GameStates, audioFileName?: string) {
        if (hudHint && platform) {
            this._platform = platform;
            this.text = hudHint[this._platform];
        }
        this.currentState = currentGameState;
        if (audioFileName) {
            this.audioFileName = audioFileName;
        } else {
            this.audioFileName = HintAudioFiles.get(hudHint)[platform];
        }
        this.howlerAudioObject = HUDAudioFiles.get(this.audioFileName);

        this.stopHintAudio();
        this.playHintAudio();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this._platform = platform;
        if (newState === GameStates.BASE) {
            return new BaseState(global.hudHints["GAME_STATE_BASE"], this._platform);
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

    playHintAudio(): void {
        if (this.howlerAudioObject) {
            this.howlerAudioObject.play();
        }
    }

    stopHintAudio(): void {
        if (this.howlerAudioObject) {
            this.howlerAudioObject.stop();
        }
    }
}

export class StartState extends GameState {
    constructor(hudHint: HudHint, platform: string) {
        super(hudHint, platform, GameStates.START);
        this.updateHUDText();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.stopHintAudio();
        this.platform = platform;
        return new BaseState(global.hudHints["GAME_STATE_BASE"], this.platform);
    }
}

export class BaseState extends GameState {
    constructor(hudHint: HudHint, platform: string) {
        super(hudHint, platform, GameStates.BASE);
        this.updateHUDText();
        this.displayingHUD = true;
        console.log("In Base state");
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        this.stopHintAudio();
        if (newState === GameStates.GRAB) {
            if (args.length > 0) {
                let mesh: AbstractMesh = args[0];
                if (mesh.name === "fire-extinguisher") {
                    return new GrabState(global.hudHints["GAME_STATE_PICK_FIREEXTINGUISHER"], this.platform);        
                } else if (mesh.name.startsWith("cylinder")) {
                    return new GrabState(global.hudHints["GAME_STATE_PICK_CYLINDER"], this.platform);
                } else if (mesh.name.startsWith("Door")) {
                    return new GrabState(global.hudHints["AME_STATE_DOOR_GRAB"], this.platform);
                }
            }                        
            return new GrabState(global.hudHints["GAME_STATE_PICK"], this.platform);
        }

        return null;
    }
}

export class GrabState extends GameState {
    constructor(hudHint: HudHint, platform: string) {
        super(hudHint, platform, GameStates.GRAB);
        this.updateHUDText();
        this.displayingHUD = true;

    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        this.stopHintAudio();
        if (newState === GameStates.LOSE) {
            return new FailState(global.hudHints["GAME_STATE_FAIL"], this.platform);
        }
        return new BaseState(global.hudHints["GAME_STATE_BASE"], this.platform);
    }
}


export class PickState extends GameState {
    constructor(hudHint: HudHint, platform: string) {
        super(hudHint, platform, GameStates.PICK);
        this.updateHUDText();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.platform = platform;
        this.stopHintAudio();
        if (newState === GameStates.GRAB) {
            if (args.length > 0) {
                let mesh: AbstractMesh = args[0];
                if (mesh.name === "fire-extinguisher") {
                    return new GrabState(global.hudHints["GAME_STATE_PICK_FIREEXTINGUISHER"], this.platform);        
                }
            }
            return new GrabState(global.hudHints["GAME_STATE_PICK_CYLINDER"], this.platform);
        } else if (newState === GameStates.BASE) {
            return new BaseState(global.hudHints["GAME_STATE_BASE"], this.platform);
        }
        return null;
    }    
}

export class FailState extends GameState {
    constructor(hudHint: HudHint, platform: string) {
        super(hudHint, platform, GameStates.PICK);
        this.updateHUDText();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this.stopHintAudio();
        return this;
    }    
}
import { GameStates } from "./stateMachine";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { HudHint, HUDAudioFiles, HintAudioFiles } from "../managers/audioManager";


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

    static isLost: boolean = false;

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
        if (hudHint !== undefined) {
            if (audioFileName) {
                this.audioFileName = audioFileName;
            } else {
                this.audioFileName = HintAudioFiles.get(hudHint)[platform];
            }
            this.howlerAudioObject = HUDAudioFiles.get(this.audioFileName);
        }
        this.stopHintAudio();
    }

    handleStateChange(newState: GameStates, platform: string, ...args: any): GameState {
        this._platform = platform;
        return null;
    }

    updateHUDText(): void {
        if (this.text === null || this.text === undefined) {
            this.text = "Loading...";
        }
    }

    configureXR(): void {
        this._platform = "xr";
        this.updateHUDText();
    }

    playHintAudio(): void {
        if (this.howlerAudioObject) {
            this.howlerAudioObject.stop();
            this.howlerAudioObject.play();
        }
    }

    stopHintAudio(): void {
        if (this.howlerAudioObject) {
            this.howlerAudioObject.stop();
        }
    }
}
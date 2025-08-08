import { Observable } from "@babylonjs/core/Misc/observable";
import { GameState } from "./gameStateObjects";
import { InteractionMode } from "../managers/interactions/handlers/baseInteractionHandler";

//Set up game states

export enum GameStates {
    START,
    END,
    RESET
}

export class StateMachine {
    onStateChangeObervable: Observable<GameStates> = new Observable();
    currentGameState: GameState;
    platform: string;
    changedHints: boolean;

    constructor(platform: string) {
        this.platform = platform;
        this.changedHints = false;
    }

    #delegateState(newState: GameStates, ...args: any) {
        let nextState = this.currentGameState.handleStateChange(newState, this.platform, ...args);
        if (nextState !== null) {
            this.currentGameState = nextState;
        }
    }

    #getStringFromMode(mode: InteractionMode): string {
        switch (mode) {
            case InteractionMode.DESKTOP:
                return "desktop";
            case InteractionMode.MOBILE:
                return "mobile";
            case InteractionMode.XR:
                return "xr";
            case InteractionMode.LOADING:
                return "loading";
            default:
                return "null";
        }
    }
}
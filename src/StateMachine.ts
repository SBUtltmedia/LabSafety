import { Observable } from "@babylonjs/core/Misc/observable";
import { GameState } from "./GameStateObjects";
import { interactionManager } from "./scene";
import { InteractionMode } from "./interactionManager";

export enum GameStates {
    GAME_STATE_START,
    GAME_STATE_BASE,
    GAME_STATE_PICK_SOP,
    GAME_STATE_DROP_SOP,
    GAME_STATE_PICK_FIREEXTINGUISHER,
    GAME_STATE_DROP_FIREEXTINGUISHER,    
    GAME_STATE_PICK_CYLINDER,
    GAME_STATE_DROP_CYLINDER,
    GAME_STATE_PASS,
    GAME_STATE_FAIL,
    GAME_STATE_SOP_PASS,
}

export class StateMachine {
    onStateChangeObervable: Observable<GameStates> = new Observable();
    currentGameState: GameState;
    platform: string;

    constructor() {
        this.currentGameState = new GameState(null, "desktop");
        this.onStateChangeObervable.add(newState => {
            this.#delegateState(newState);
        });
        this.platform = "desktop";

        interactionManager.onModeChangeObservable.add(newMode => {
            this.platform = this.#getStringFromMode(newMode);
            if (this.platform !== "loading" && this.platform !== "null") {
                this.#delegateState(GameStates.GAME_STATE_BASE);
            }
        })
    }

    #delegateState(newState: GameStates) {
        let nextState = this.currentGameState.handleStateChange(newState, this.platform);
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
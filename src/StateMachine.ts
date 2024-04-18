import { Observable } from "@babylonjs/core/Misc/observable";
import { GameState } from "./GameStateObjects";
import { interactionManager } from "./scene";
import { InteractionMode } from "./interactionManager";

export enum GameStates {
    START,
    BASE,
    HIGHLIGHT,
    GRAB,
    ACTIVATE
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

        interactionManager.onHasAnyTargetsObservable.add(isTarget => {
            if (isTarget) {
                this.#delegateState(GameStates.HIGHLIGHT);
            } else {
                this.#delegateState(GameStates.BASE);
            }
        })

        interactionManager.onModeChangeObservable.add(newMode => {
            this.platform = this.#getStringFromMode(newMode);
            if (this.platform !== "loading" && this.platform !== "null") {
                this.#delegateState(GameStates.BASE);
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
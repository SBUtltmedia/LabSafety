import { Observable } from "@babylonjs/core/Misc/observable";
import { GameState } from "./GameStateObjects";
import { interactionManager } from "./scene";
import { GrabState, IMeshGrabInfo, InteractionMode } from "./interactionManager";
import { finalGameState } from "./GameTasks";
import { Status } from "./Task";

export enum GameStates {
    START,
    BASE,
    HIGHLIGHT,
    GRAB,
    ACTIVATE,
    PICK,
    WIN,
    LOSE
}

export class StateMachine {
    onStateChangeObervable: Observable<GameStates> = new Observable();
    currentGameState: GameState;
    platform: string;

    constructor() {
        this.currentGameState = new GameState(null, "desktop", GameStates.START);
        this.onStateChangeObervable.add(newState => {
            this.#delegateState(newState);
        });
        this.platform = "desktop";

        interactionManager.onHasAnyTargetsObservable.add(isTarget => {
            if (isTarget) {
                this.#delegateState(GameStates.PICK);
            } else {
                if (this.currentGameState.currentState === GameStates.PICK) {
                    this.#delegateState(GameStates.BASE);
                }
            }
        })

        interactionManager.onModeChangeObservable.add(newMode => {
            this.platform = this.#getStringFromMode(newMode);
            if (this.platform !== "loading" && this.platform !== "null") {
                this.#delegateState(GameStates.BASE);
            }
        })

        interactionManager.onGrabStateChangedObservable.add((meshGrabInfo)  => {
            if (meshGrabInfo.state === GrabState.GRAB) {
                this.#delegateState(GameStates.GRAB, meshGrabInfo.mesh);
            } else {
                this.#delegateState(GameStates.BASE);
            }
        })

        finalGameState.add(newStatus => {
            if (newStatus === Status.FAILURE) {
                this.#delegateState(GameStates.LOSE);
            }
        })

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
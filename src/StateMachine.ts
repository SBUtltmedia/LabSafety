import { Observable } from "@babylonjs/core/Misc/observable";
import { GameState } from "./GameStateObjects";
import { interactionManager } from "./scene";
import { GrabState, InteractionMode } from "./interactionManager";
import { finalGameState } from "./GameTasks";
import { Status } from "./Task";

//Set up game states

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

    constructor(platform: string) {
        this.platform = platform
        this.currentGameState = new GameState(null, this.platform, GameStates.START);
        this.onStateChangeObervable.add(newState => {
            this.#delegateState(newState);
        });

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
            console.log("im new mode: ", newMode);
            this.platform = this.#getStringFromMode(newMode);
            console.log("new mode: ", this.platform);
            this.currentGameState.platform = this.platform;
            this.currentGameState.toggleHUD();
            this.currentGameState.toggleHUD();
            if (this.platform !== "loading" && this.platform !== "null") {
                this.#delegateState(GameStates.BASE);
            }
        })

        interactionManager.onGrabStateChangedObservable.add((meshGrabInfo)  => {
            console.log("grab state change: ", meshGrabInfo);
            if (meshGrabInfo.state === GrabState.GRAB) {
                this.#delegateState(GameStates.GRAB, meshGrabInfo.mesh);
            } else {
                this.#delegateState(GameStates.BASE);
            }
            if (meshGrabInfo.mesh.name === "clipboard") {
                this.#toggleDisplay();                
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

    #toggleDisplay() {
        this.currentGameState.toggleHUD();
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
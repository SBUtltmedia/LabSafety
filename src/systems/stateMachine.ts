import { Observable } from "@babylonjs/core/Misc/observable";
import { GameState } from "./gameStateObjects";
import { interactionManager } from "../scene";
import { GrabState, InteractionMode } from "../managers/interactions/handlers/baseInteractionHandler";
import { finalGameState } from "./gameTasks";
import { Status } from "./task";
import { global } from "../globalState";

//Set up game states

export enum GameStates {
    START,
    BASE,
    HIGHLIGHT,
    GRAB,
    ACTIVATE,
    PICK,
    WIN,
    LOSE,
    PICK_SOP
}

export class StateMachine {
    onStateChangeObervable: Observable<GameStates> = new Observable();
    currentGameState: GameState;
    platform: string;
    changedHints: boolean;

    constructor(platform: string) {
        this.platform = platform;
        this.changedHints = false;
        this.currentGameState = new GameState(global.hudHints["GAME_STATE_BASE"], this.platform, GameStates.START);
        this.onStateChangeObervable.add(newState => {
            this.#delegateState(newState);
        });

        interactionManager.onHasAnyTargetsObservable.add((isTarget: any) => {
            if (isTarget) {
                this.#delegateState(GameStates.PICK);
            } else {
                if (this.currentGameState.currentState === GameStates.PICK) {
                    this.#delegateState(GameStates.BASE);
                }
            }
        })

        interactionManager.onModeChangeObservable.add((newMode: InteractionMode) => {
            this.platform = this.#getStringFromMode(newMode);
            this.currentGameState.platform = this.platform;
            this.currentGameState = new GameState(global.hudHints["GAME_STATE_BASE"], this.platform, GameStates.START);
            this.currentGameState.updateHUDText();
            if (this.platform !== "loading" && this.platform !== "null") {
                this.#delegateState(GameStates.BASE);
            }
        })

        interactionManager.onGrabStateChangedObservable.add((meshGrabInfo: { state: GrabState; mesh: { name: string; }; })  => {
            if (meshGrabInfo.state === GrabState.GRAB) {
                this.#delegateState(GameStates.GRAB, meshGrabInfo.mesh);
            } else {
                if (meshGrabInfo.mesh.name === "clipboard") {
                    if (!this.changedHints) {
                        this.changedHints = true;
                        global.hudHints["GAME_STATE_BASE"] = global.hudHints["GAME_STATE_AFTER_SOP"];
                    }
                }
                this.#delegateState(GameStates.BASE);
                if (this.currentGameState.displayingHUD === false) {
                    this.currentGameState.updateHUDText();
                }
            }

        })

        interactionManager.isUsingXRObservable.add((isXR: any) => {
            if (isXR) {
                this.currentGameState.configureXR();
            }
        })

        finalGameState.add(newStatus => {
            if (newStatus === Status.FAILURE) {
                this.#delegateState(GameStates.LOSE);
            } else if (newStatus === Status.RESET) {
                console.log("Reset state machine");
            } else if (newStatus === Status.SUCCESSFUL) {
                this.#delegateState(GameStates.WIN);
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
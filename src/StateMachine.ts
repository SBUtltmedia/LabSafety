import { Observable } from "@babylonjs/core/Misc/observable";
import { GameState } from "./GameStateObjects";
import { interactionManager } from "./scene";
import { GrabState, InteractionMode } from "./interactionManager";
import { finalGameState } from "./GameTasks";
import { Status } from "./Task";
import { global } from "./GlobalState";

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
            this.currentGameState.disposeHUD();
            this.currentGameState = new GameState(global.hudHints["GAME_STATE_BASE"][platform], this.platform, GameStates.START);
            this.currentGameState.displayHUD();
            if (this.platform !== "loading" && this.platform !== "null") {
                this.#delegateState(GameStates.BASE);
            }
        })

        interactionManager.onGrabStateChangedObservable.add((meshGrabInfo)  => {
            console.log("grab state change: ", meshGrabInfo);
            if (meshGrabInfo.state === GrabState.GRAB) {
                this.#delegateState(GameStates.GRAB, meshGrabInfo.mesh);
                if (meshGrabInfo.mesh.name === "clipboard") {
                    this.#toggleDisplay();
                }
            } else {
                console.log("Drop obj")
                if (meshGrabInfo.mesh.name === "clipboard") {
                    if (!this.changedHints) {
                        this.changedHints = true;
                        console.log("Drop clip");
                        for (let platform of ["mobile", "desktop", "xr"]) {
                            global.hudHints["GAME_STATE_BASE"][platform] = global.hudHints["GAME_STATE_AFTER_SOP"][platform];
                        }
                    }
                }
                this.#delegateState(GameStates.BASE);
                if (this.currentGameState.displayingHUD === false) {
                    this.currentGameState.displayHUD();
                }
            }

        })

        interactionManager.isUsingXRObservable.add(isXR => {
            if (isXR) {
                this.currentGameState.configureXR();
            }
        })

        finalGameState.add(newStatus => {
            if (newStatus === Status.FAILURE) {
                this.#delegateState(GameStates.LOSE);
            } else if (newStatus === Status.RESET) {
                console.log("Reset!");
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
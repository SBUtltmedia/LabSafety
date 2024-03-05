import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Nullable } from "@babylonjs/core/types";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { GameState } from "./GameStateObjects";

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

export class GameStateBehavior implements Behavior<UniversalCamera> {
    #stateChangeObserver: Nullable<Observer<GameStates>> = null;
    onStateChangeObervable: Observable<GameStates> = new Observable();
    currentGameState: GameState = new GameState(null, "desktop");
    platform: string;

    constructor() {}

    init(): void {}

    attach(target: UniversalCamera): void {
        this.#stateChangeObserver = this.onStateChangeObervable.add(newState => {
            this.delegateState(newState);
        });
    }

    delegateState(newState: GameStates) {
        let nextState = this.currentGameState.handleStateChange(newState, this.platform);
        if (nextState !== null) {
            this.currentGameState = nextState;
        }
    }

    detach(): void {
        this.#stateChangeObserver.remove();
    }

    get name(): string {
        return "StateMachine";
    }
}
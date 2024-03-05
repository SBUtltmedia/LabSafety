import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { HUD_HINTS_PATH } from "./Constants";
import { IHUDHints, global } from "./GlobalState";
import { GameStateBehavior } from "./GameStateBehavior";

export const setupGameStates = (camera: UniversalCamera) => {
    let gameStateMachine = new GameStateBehavior();
    camera.addBehavior(gameStateMachine);

    fetch(HUD_HINTS_PATH)
        .then(r => r.json())
        .then((json: IHUDHints) => {
            global.hudHints = Object.assign({}, json);
        });
}
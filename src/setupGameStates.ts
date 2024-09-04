import { HUD_HINTS_PATH } from "./Constants";
import { IHUDHints, global } from "./GlobalState";
import { StateMachine } from "./StateMachine";

export let stateMachine: StateMachine;

export const setupGameStates = (platform: string) => {
    stateMachine = new StateMachine(platform);

    fetch(HUD_HINTS_PATH)
        .then(r => r.json())
        .then((json: IHUDHints) => {
            global.hudHints = Object.assign({}, json);
        });
}
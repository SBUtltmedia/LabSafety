import { HUD_HINTS_PATH } from "./Constants";
import { IHUDHints, global } from "./GlobalState";
import { GameStates, StateMachine } from "./StateMachine";

export let stateMachine: StateMachine;

export type HudHint = {[key: string]: string};

export let soundMap = new Map<HudHint, string[]>();

export const platformMap: {[key: string]: number} = {
    "desktop": 0,
    "mobile": 1,
    "xr": 2
};

export const setupGameStates = (platform: string) => {
    fetch(HUD_HINTS_PATH)
        .then(r => r.json())
        .then((json: IHUDHints) => {
            global.hudHints = Object.assign({}, json);
            Object.keys(global.hudHints).map((hudName, idx) => {
                soundMap.set(global.hudHints[hudName], [`${idx * 3}`, `${(idx * 3) + 1}`, `${(idx * 3) + 2}`]);
            });
            stateMachine = new StateMachine(platform);
        }).then(() => {
            stateMachine.onStateChangeObervable.notifyObservers(GameStates.BASE);
        })
}
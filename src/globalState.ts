import { Sound } from "@babylonjs/core/Audio/sound";
import { Task } from "./systems/task";

export interface IHUDHints {
    [key: string]: {[key: string]: string};
}

interface ISound{
    [key:string]:Sound   
}

interface IGlobal {
    sop: Task,
    taskList: Task[],
    json: null,
    sounds: ISound,
    hudHints: IHUDHints,
};

export const global: IGlobal = {
    sop: null,
    taskList: null,
    json: null,
    sounds:{},
    hudHints: {}
};

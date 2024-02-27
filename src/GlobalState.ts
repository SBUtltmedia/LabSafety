import { Sound } from "@babylonjs/core/Audio/sound";
import { Task } from "./Task";
interface ISound{
    [key:string]:Sound   
}

interface IGlobal {
    sop: Task,
    taskList: Task[],
    json: null,
    sounds:ISound
};

export const global: IGlobal = {
    sop: null,
    taskList: null,
    json: null,
    sounds:{}
};
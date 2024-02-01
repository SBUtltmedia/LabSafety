import { Task } from "./Task";

interface IGlobal {
    sop: Task,
    taskList: Task[],
    json: null
};

export const global: IGlobal = {
    sop: null,
    taskList: null,
    json: null
};
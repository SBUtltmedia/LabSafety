import { Task } from "./Task";

interface IGlobal {
    sop: Task,
    taskList: Task[]
};

export const global: IGlobal = {
    sop: null,
    taskList: null
};
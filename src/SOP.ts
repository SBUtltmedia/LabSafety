export default class SOP {
    /*
    tasks is a directed acyclic graph. This is to allow arbitrary dependencies of tasks, allowing the SOP to have tasks that can be completed in any order.
    */
    complete = false;
    title: string;
    description: string;
    failed: boolean = false;
    onFail?: () => void;
    onSuccess?: () => void;
    onCompletion?: () => void;
    currentState: number;
    tasks: Array<any>;

    constructor(title: string, description: string, tasks: Array<any>, currentState: number = 0) {
        this.title = title;
        this.description = description;
        this.tasks = tasks;
        this.currentState = currentState;
    }

    resetSOP = () => {
        this.currentState = 0;
        this.failed = false;
        this.complete = false;
    }

}
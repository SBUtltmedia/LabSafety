import { Observable, Observer } from "@babylonjs/core/Misc/observable";

import { log } from "./utils";

export enum Status {
    SUCCESSFUL,
    FAILURE,
    RESET
}

export class Task {
    name: string;
    description: string;
    #status: Status;
    optional: boolean;  // If false, when a task fails, its supertask will also fail.

    // Subtasks are an Array of Arrays of Tasks. Each Array of Tasks represents Tasks that must be completed in order:
    // if a Task is completed out of order, that Task Array fails. For example: [[pourAtoC, pourCtoB], [pourDtoE, pourEtoF], [doADance]].
    subtasks: Task[][];
    subtaskObservers: Observer<Status>[][];
    onTaskStateChangeObservable: Observable<Status>;

    constructor(name: string, description: string, subtasks: Task[][], optional = false) {
        this.name = name;
        this.description = description;
        this.#status = Status.RESET;
        this.optional = optional;

        if (subtasks.some(orderedSubtasks => orderedSubtasks.length === 0)) {
            // This isn't strictly necessary; we could handle it if we wanted to.
            // But I can't think of any reason we might possibly want an empty subtask
            // partition, so we might as well ban it and avoid some checks later on.
            throw new Error(`Task ${this.name}: subtask partition must not be empty.`);
        }
        this.subtasks = subtasks;
        this.onTaskStateChangeObservable = new Observable();

        // Add observers to monitor subtasks
        this.subtaskObservers = this.subtasks.map(orderedSubtasks => {
            return orderedSubtasks.map((subtask, i) => {
                const observer = subtask.onTaskStateChangeObservable.add((status, eventState) => {
                    switch (status) {
                        case Status.FAILURE:
                            if (!subtask.optional) {
                                this.fail();
                            }
                            break;
                        case Status.SUCCESSFUL:
                            if (i !== 0 && orderedSubtasks[i-1].status !== Status.SUCCESSFUL) {
                                // Task completed out of order.
                                log("Out of order");
                                eventState.skipNextObservers = true;
                                break;
                            }
                            
                            // TODO: remove this work around later
                            // setTimeout(() => {

                                // Check that the last Task of each ordered partition is succeeded.
                                // This implies that the whole partition is succeeded.
                                const subtasksSucceeded = this.subtasks.every(orderedSubtasks => {

                                    // the status checks for success before the success of task C->A changes to 0
                                    // hence, always return false, meaning SOP would never succeed

                                    // setTimeout(() => {
                                    //     log("Status: ", orderedSubtasks.at(-1).name, orderedSubtasks.at(-1).status);
                                    // }, 1000);
                                    
                                    log("Status: ", orderedSubtasks.at(-1).name, orderedSubtasks.at(-1).status);

                                    return orderedSubtasks.at(-1).status === Status.SUCCESSFUL;
                                });
                                
                                log("Sub task succeeded: ", subtasksSucceeded, this.subtasks);

                                if (subtasksSucceeded) {
                                    this.#succeed();
                                }
                            // }, 1000);

                            break;
                        case Status.RESET:
                            break;
                    }
                });

                // Ensure that the supertask is notified first. This is necessary when a task is completed out of order,
                // so the supertask can cancel the notification and fail the task. This ensures that observers are only
                // notified of success when it's actually correct.
                subtask.onTaskStateChangeObservable.makeObserverTopPriority(observer);
                return observer;
            });
        });
    }

    fail = () => {
        // Only leaf Tasks can be manually failed. Internal Tasks automatically fail or succeed when their subtasks fail or succeed.
        if (this.#status !== Status.RESET) {
            throw new Error(`Attempted to fail a Task (${this.name}) which has already succeeded or failed.`);
        }

        const valid = this.onTaskStateChangeObservable.notifyObservers(Status.FAILURE);
        
        // Note: Currently, `valid` should always be true.
        if (valid) {
            log(`Failing Task ${this.name}`);
            this.#status = Status.FAILURE;
        } else {
            throw new Error(`Task ${this.name}: An observer skipped following observers.`);
        }
    }

    succeed = () => {
        // Only leaf Tasks can be manually succeeded. Internal Tasks automatically succeed or fail when their subtasks succeed or fail.
        if (this.subtasks.length) {
            throw new Error(`Task ${this.name} has subtasks and cannot be manually succeeded.`);
        }
        this.#succeed();
    }

    #succeed = () => {
        if (this.#status !== Status.RESET) {
            throw new Error(`Attempted to succeed a Task (${this.name}) which has already succeeded or failed.`);
        }

        // This will notify the supertask first. If `valid` is true, the task was correctly
        // succeeded and the status should be changed. If false, the supertask (or some other
        // authority) canceled the succeeding process, and the task should fail.
        this.#status = Status.SUCCESSFUL;
        const valid = this.onTaskStateChangeObservable.notifyObservers(Status.SUCCESSFUL);
        if (valid) {
            log(`Succeeding Task ${this.name}`);
        } else {
            // This task was completed out of order. Fail.
            this.fail();
        }
    }

    reset = () => {
        this.subtasks.forEach(orderedSubtasks => {
            orderedSubtasks.forEach(subtask => subtask.reset())
        });
        this.#status = Status.RESET;
        this.onTaskStateChangeObservable.notifyObservers(this.#status);
    }

    get failed() {
        return this.#status === Status.FAILURE;
    }

    get successful() {
        return this.#status === Status.SUCCESSFUL;
    }

    get status() {
        return this.#status;
    }
}

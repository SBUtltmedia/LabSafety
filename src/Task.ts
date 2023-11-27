import { Observable, Observer } from "@babylonjs/core";

enum Status {
    SUCCESSFUL,
    FAILURE,
    RESET
}

export class Task {
    name: string;
    description: string;
    #status: Status;

    // Subtasks are an Array of Arrays of Tasks. Each Array of Tasks represents Tasks that must be completed in order:
    // if a Task is completed out of order, that Task Array fails. For example: [[pourAtoC, pourCtoB], [pourDtoE, pourEtoF], [doADance]].
    subtasks: Task[][];
    subtaskObservers: Observer<Status>[][];
    onTaskStateChangeObservable: Observable<Status>;

    constructor(name: string, description: string, subtasks: Task[][]) {
        this.name = name;
        this.description = description;
        this.#status = Status.RESET;

        if (subtasks.some(orderedSubtasks => orderedSubtasks.length === 0)) {
            // This isn't strictly necessary; we could handle it if we wanted to.
            // But I can't think of any reason we might possibly want an empty subtask
            // partition, so we might as well ban it and avoid some checks later on.
            throw new Error(`Task ${this.name}: subtask partition must not be empty.`);
        }
        this.subtasks = subtasks;
        this.onTaskStateChangeObservable = new Observable();

        // @todo: Long.
        this.subtaskObservers = this.subtasks.map(orderedSubtasks => {
            return orderedSubtasks.map((subtask, i) => {
                return subtask.onTaskStateChangeObservable.add(status => {
                    switch (status) {
                        case Status.FAILURE:
                            // Currently, a single failure in a Task's subtask is an instant short-circuit.
                            // That's how the game is at the moment, but it's reasonable to want to allow
                            // optional Tasks. That's fairly easy to add: maybe add an `optional` boolean
                            // to Task and add a new degree of failure to Status (e.g., SOFT_FAILURE, HARD_FAILURE).
                            this.fail();
                            break;
                        case Status.SUCCESSFUL:
                            // Check that the last Task of each ordered partition is succeeded.
                            // This implies that the whole partition is succeeded.
                            const subtasksSucceeded = subtask.subtasks.every(orderedSubtasks => {
                                return orderedSubtasks.at(-1).status === Status.SUCCESSFUL;
                            });
                            if (subtasksSucceeded) {
                                // Verify that the Task was completed in order. If it was, succeed, else fail.
                                if (i === 0 || orderedSubtasks[i-1].status === Status.SUCCESSFUL) {
                                    this.succeed();
                                } else {
                                    // Task completed out of order.
                                    this.fail();
                                }
                            }
                            break;
                        case Status.RESET:
                            break;
                    }
                });
            });
        });
    }

    fail = () => {
        // Only leaf Tasks can be manually failed. Internal Tasks automatically fail or succeed when their subtasks fail or succeed.
        if (this.#status !== Status.RESET) {
            throw new Error(`Attempted to fail a Task (${this.name}) which has already succeeded or failed.`);
        }
        this.#status = Status.FAILURE;
        this.onTaskStateChangeObservable.notifyObservers(this.#status);
    }

    succeed = () => {
        // Only leaf Tasks can be manually succeeded. Internal Tasks automatically succeed or fail when their subtasks succeed or fail.
        if (this.#status !== Status.RESET) {
            throw new Error(`Attempted to succeed a Task (${this.name}) which has already succeeded or failed.`);
        }
        if (this.subtasks.length) {
            throw new Error(`Task ${this.name} has subtasks and cannot be manually succeeded.`);
        }
        this.#status = Status.SUCCESSFUL;
        this.onTaskStateChangeObservable.notifyObservers(this.#status);
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

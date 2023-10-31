import { Observable, Observer } from "@babylonjs/core";

enum Status {
    SUCCESSFUL,
    FAILURE,
    RESET
}

export class Task {
    // @todo: Add an onReset()?
    name: string;
    description: string;
    #status: Status;
    subtasks: Task[];
    // @todo: should we use Babylon's Observable here?
    // It's not necessary (for example, I think a Promise would be equivalent, but less convenient),
    // and the SOP and Task are otherwise independent from Babylon.
    onTaskStateChangeObservable: Observable<Status>;
    onSuccess?: () => void;
    onFailure?: () => void;

    constructor(name: string, description: string, subtasks: Task[], onSuccess?: () => void, onFailure?: () => void) {
        this.name = name;
        this.description = description;
        this.#status = Status.RESET;
        this.subtasks = subtasks;
        this.onSuccess = onSuccess;
        this.onFailure = onFailure;
        this.onTaskStateChangeObservable = new Observable();
    }

    fail = () => {
        if (this.#status !== Status.RESET) {
            throw new Error(`Attempted to fail a Task (${this.name}) which has already succeeded or failed.`);
        }
        this.#status = Status.FAILURE;
        if (this.onFailure) {
            this.onFailure();
        }
        
        // I intentionally pass TaskStatus.FAILURE instead of this.#status, even though
        // they should normally be the same, just in case this.onFailure() somehow
        // modifies this.#status before we can notify the Observers.
        this.onTaskStateChangeObservable.notifyObservers(Status.FAILURE);
    }

    succeed = () => {
        if (this.#status !== Status.RESET) {
            throw new Error(`Attempted to succeed a Task (${this.name}) which has already succeeded or failed.`);
        }
        this.#status = Status.SUCCESSFUL;
        if (this.onSuccess) {
            this.onSuccess();
        }

        // I intentionally pass TaskStatus.SUCCESSFUL instead of this.#status, even though
        // they should normally be the same, just in case this.onSuccess() somehow
        // modifies this.#status before we can notify the Observers.
        this.onTaskStateChangeObservable.notifyObservers(Status.SUCCESSFUL);
    }

    reset = () => {
        // For now, the initial children aren't saved, because it's assumed that child tasks
        // essentially won't change. It's easy to add if we want.
        this.#status = Status.RESET;
        this.subtasks.forEach(task => task.reset());

        this.onTaskStateChangeObservable.notifyObservers(Status.RESET);
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

export class SOP {
    // @todo: How do we define success? I think it should be the success of all the top-level Tasks;
    // that is, subtasks aren't check. It's a Task's responsibility to ensure that its intended status
    // is correct; the SOP won't check.
    // @todo: How do we handle having tasks that might be a mix of being ordered and unordered?
    // Maybe an Array of Task Arrays, where each Task Array represents a partition? So each
    // Task Array is ordered, but the Task Arrays are not ordered among each other.
    name: string;
    description: string;
    #status: Status;
    initialTasks: Task[];  // Save for reset
    tasks: Task[];
    taskObservers: Observer<Status>[];

    onSuccess?: () => void;  // Callback for total completion of the SOP
    onFailure?: () => void;  // Callback for total failure of the SOP

    constructor(name: string, description: string, tasks: Task[], onSuccess?: () => void, onFailure?: () => void) {
        this.name = name;
        this.description = description;
        this.initialTasks = [...tasks];
        this.tasks = tasks;
        this.onSuccess = onSuccess;
        this.onFailure = onFailure;
        this.#status = Status.RESET;

        // @todo: Long.
        // The idea with the Observables in Task is to notify the SOP when the Task's state changes.
        // This is how the SOP detects when the it should succeed (and win the game). The this.taskObservers
        // Array is just to keep track of the Observers on each Task, so that (for example) an Observer can
        // be unregistered if a Task is removed from the SOP.
        this.taskObservers = this.tasks.map(task => {
            return task.onTaskStateChangeObservable.add(status => {
                switch (status) {
                    case Status.FAILURE:
                        // Currently, a single failure in a top-level Task is an instant short-circuit.
                        // That's how the game is at the moment, but it's reasonable to want to allow
                        // optional Tasks. That's fairly easy to add: maybe add an `optional` boolean
                        // to Task and add a new degree of failure to Status (e.g., SOFT_FAILURE, HARD_FAILURE).
                        this.fail();
                        break;
                    case Status.SUCCESSFUL:
                        // This is needlessly slow, but it's not as if we have thousands of
                        // Tasks at the moment. An easy optimization would be to add a property
                        // keeping track of the successful Tasks, succeeding when the
                        // counter === this.tasks.length.

                        // Check if all Tasks have now been successfully completed.
                        const allTasksSucceeded = this.tasks.every(({ status }) => status === Status.SUCCESSFUL);
                        if (allTasksSucceeded) {
                            this.succeed();
                        }
                        break;
                    case Status.RESET:
                        break; 
                }
            });
        });
    }

    fail = () => {
        if (this.#status !== Status.RESET) {
            throw new Error(`Attempted to fail SOP (${this.name}) which has already succeeded or failed.`);
        }
        this.#status = Status.FAILURE;
        if (this.onFailure) {
            this.onFailure();
        }
    }

    succeed = () => {
        if (this.#status !== Status.RESET) {
            throw new Error(`Attempted to succeed SOP (${this.name}) which has already succeeded or failed.`);
        }
        this.#status = Status.SUCCESSFUL;
        if (this.onSuccess) {
            this.onSuccess();
        }
    }

    reset = () => {
        this.#status = Status.RESET;
        this.tasks = this.initialTasks;
        this.tasks.forEach(task => task.reset());
    }
}

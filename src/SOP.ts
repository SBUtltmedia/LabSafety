import { Sound } from '@babylonjs/core/Audio/sound';
import { Nullable } from '@babylonjs/core/types';
import { Task } from './constants';
import DAGNode from './DAGNode';
import DirectedAcyclicGraph from './DirectedAcyclicGraph';
import { playSound } from './utils';

export default class SOP {
    /*
    tasks is a directed acyclic graph. This is to allow arbitrary dependencies of tasks, allowing the SOP to have tasks that can be completed in any order.
    */
    complete = false;
    title: string;
    description: string;
    tasks: DirectedAcyclicGraph<Task>;
    currentNode: DAGNode<Task>;
    failed: boolean = false;
    onFail?: () => void;
    onSuccess?: () => void;
    failSound?: Sound;
    successSound?: Sound;

    constructor(title: string, description: string) {
        this.title = title;
        this.description = description;
        this.tasks = new DirectedAcyclicGraph<Task>();
        this.currentNode = this.tasks.root;
    }

    addDependentTask = (task: Task, setToCurrent = false) => {
        // Add task to the SOP that must not be completed until the current task is completed.
        const node = this.currentNode.addDependent(task);
        if (setToCurrent) this.currentNode = node;
    }

    addConcurrentTask = (task: Task) => {
        // Add a task to the SOP that has the same dependencies as the current task.
        const node = new DAGNode<Task>(task, [...this.currentNode.dependencies], []);
        node.dependencies.forEach(dependency => {
            dependency.dependents.push(node);
        });
    }

    addTaskDependentOnConcurrentTasks = (task: Task) => {
        throw new Error('Not implemented');
    }

    checkNodeDependenciesCompleted = (node: DAGNode<Task>): boolean => {
        // TODO: should this method belong in DAGNode? Probably. (However, maybe it should be static to allow easy recursion (no this rebinding required).)
        // Verify that ALL the tasks of the node's dependencies have been completed.
        // TODO: should this only check DIRECT dependencies, relying on previous checks to maintain the dependencies?
        if (!node.dependencies.length) {
            return true;
        }
        return node.dependencies.every(dependency => {
            // TODO: what if value is null? This is currently possible. Probably the value shouldn't be nullable. Or it should ONLY be nullable as the root.
            return dependency.value ? dependency.value.complete && this.checkNodeDependenciesCompleted(dependency) : true;  // if !dependency.value, then dependency is the dummy root node.
        });
    }

    getNodeByTask = (task: Task): Nullable<DAGNode<Task>> => {
        // Perform a breadth-first search to select a node matching the given task.
        // TODO: test this function. It's a little tricky.
        const getNodeByTaskRec = (cursor: DAGNode<Task>): Nullable<DAGNode<Task>> => {
            if (cursor.value === task) return cursor;

            return cursor.dependents.map((node: DAGNode<Task>) => getNodeByTaskRec(node)).find((node: Nullable<DAGNode<Task>>) => node) || null;
        };
        return getNodeByTaskRec(this.tasks.root);
    }

    completeTaskFromNode = (node: DAGNode<Task>): boolean => {
        // Sets complete and returns true if the task's dependencies have been completed, otherwise does not set complete and returns false.
        if (this.checkNodeDependenciesCompleted(node)) {
            if (node.value) node.value.complete = true;
            return true;
        }
        return false;
    }

    completeTask = (task: Task): boolean => {
        if (task.complete) return true;

        let node;
        if (this.currentNode.value === task)
            node = this.currentNode;
        else 
            node = this.getNodeByTask(task);
        if (!node) return false;
        
        const completed = this.completeTaskFromNode(node);
        if (completed) {
            if (this.successSound) playSound(this.successSound);
            if (this.onSuccess) this.onSuccess();
        } else {
            this.fail();
        }
        return completed;
    }

    addFailEffects = (failSound: Sound, failCallback: () => void) => {
        this.failSound = failSound;
        this.onFail = failCallback;
    }

    addSuccessEffects = (successSound: Sound, successCallback: () => void) => {
        this.successSound = successSound;
        this.onSuccess = successCallback;
    }

    fail = () => {
        if (!this.failed) {
            // The user has failed to properly follow the SOP. Explode.
            this.failed = true;
            this.currentNode = this.tasks.root;
            this.currentNode.dependents = [];  // Strand all tasks.
            if (this.failSound) playSound(this.failSound);
            if (this.onFail) this.onFail();
        }
    }
}

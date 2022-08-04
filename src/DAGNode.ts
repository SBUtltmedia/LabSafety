import { Nullable } from "@babylonjs/core/types";

export default class DAGNode<T> {
    dependencies: DAGNode<T>[];
    dependents: DAGNode<T>[];
    value: Nullable<T>;

    constructor(value: Nullable<T>, dependencies: DAGNode<T>[], dependents: DAGNode<T>[]) {
        this.dependencies = dependencies;
        this.dependents = dependents;
        this.value = value;
    }
    
    addDependent = (value: T): DAGNode<T> => {
        const node = new DAGNode(value, [this], []);
        this.dependents.push(node);
        return node;
    }
}

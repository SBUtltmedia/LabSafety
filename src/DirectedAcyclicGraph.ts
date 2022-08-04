import DAGNode from "./DAGNode";

export default class DirectedAcyclicGraph<T> {
    root: DAGNode<T>
    constructor() {
        this.root = new DAGNode<T>(null, [], []);
    }
}

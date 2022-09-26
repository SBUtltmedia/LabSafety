import { Nullable } from '@babylonjs/core/types';

import DirectedAcyclicGraph from './DirectedAcyclicGraph';


export default class DAGNode<T> {
    /*
    Note: This implementation does not utilize the full power of directed acyclic graphs.
          Because only an addChild method exists, a node can't have multiple parents (without
          directly modifying the node's properties). This can be extended with an
          addSibling or some other, more general method. A completely general method could be used
          in conjunction with DirectedAcyclicGraph's sortedNodes property, which (when updated) contains
          a flat, topologically sorted representation of the entire graph.

          Also note that after adding or removing a node from the graph, this.graph.updateSort() must be called
    */
    graph: DirectedAcyclicGraph<T>;
    parents: DAGNode<T>[];
    children: DAGNode<T>[];
    value: Nullable<T>;
    
    constructor(value: Nullable<T>, parents: DAGNode<T>[], children: DAGNode<T>[], graph: DirectedAcyclicGraph<T>) {
        this.value = value;
        this.parents = parents;
        this.children = children;
        this.graph = graph;
    }

    addChild = (value: T): DAGNode<T> => {
        const childNode = new DAGNode(value, [this], [], this.graph);
        this.children.push(childNode);
        this.graph.updateSort();
        return childNode;
    }

    next = (): Nullable<DAGNode<T>> => {
        const sortedNodes = this.graph.sortedNodes;
        const nodeIndex = sortedNodes.findIndex(node => node === this);
        if (nodeIndex !== -1 && nodeIndex < sortedNodes.length - 1) {
            return sortedNodes[nodeIndex + 1];
        } return null;
    }
}

import { Nullable } from '@babylonjs/core/types';

import DAGNode from './DAGNode';


interface SortableNode<T> extends DAGNode<T> {
    tempMark?: boolean;
    permMark?: boolean;
}

export default class DirectedAcyclicGraph<T> {
    root: DAGNode<T>;
    currentNode: DAGNode<T>;
    sortedNodes: DAGNode<T>[];  // Topological sort of the nodes
    
    constructor() {
        this.root = new DAGNode<T>(null, [], [], this);
        this.currentNode = this.root;
        this.sortedNodes = [this.root];
    }

    getNodeByValue = (value: T): Nullable<DAGNode<T>> => {
        return this.sortedNodes.find(node => node.value === value) || null;
    }

    updateSort = () => {
        this.sortedNodes = DirectedAcyclicGraph.topologicalSort<T>(this.root);
    }

    static topologicalSort = <U> (rootNode: DAGNode<U>): DAGNode<U>[] => {
        // This algorithm uses a depth-first approach. Note that the graph must be connected.
        const nodeList: SortableNode<U>[] = [];
        const visit = (node: SortableNode<U>): void => {
            if (node.permMark) return;
            if (node.tempMark) throw new Error('DirectedAcyclicGraph error: A cycle was detected while sorting the graph.');
    
            node.tempMark = true;
    
            node.children.forEach(child => {
                visit(child as SortableNode<U>);
            });
    
            delete node.tempMark;
            node.permMark = true;
            nodeList.push(node);
        }

        visit(rootNode as SortableNode<U>);
        nodeList.forEach(node => delete node.permMark);
        return nodeList.reverse();
    }
}

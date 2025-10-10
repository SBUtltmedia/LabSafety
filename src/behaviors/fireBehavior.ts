import { Observable } from "@babylonjs/core";
import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export class FireBehavior implements Behavior<Mesh> {
    mesh: Mesh;
    extinguished: boolean = false;
    onFireObservable: Observable<boolean> = new Observable();

    constructor() {

    }

    get name() {
        return "Fire";
    }

    init() {

    }

    attach = (mesh: Mesh) => {
        this.mesh = mesh;        
    }

    extinguish = () => {
        this.extinguished = true;
        this.onFireObservable.notifyObservers(false);
        this.mesh.isVisible = false;
    }

    detach = () => {

    }
}

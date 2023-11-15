import { AbstractMesh, Behavior, Observer, PointerEventTypes, PointerInfo, Scene } from "@babylonjs/core";
import { SmokeParticles } from "./SmokeParticles";

export class SmokeBehavior implements Behavior<AbstractMesh> {
    name: string;
    mesh: AbstractMesh
    smokeParitcles: SmokeParticles;
    scene: Scene;

    pointerDownObserver: Observer<PointerInfo>;

    init(): void {
        this.name = "SmokeBehavior";
    }
    
    attach(target: AbstractMesh): void {
        this.mesh = target;
        this.smokeParitcles = new SmokeParticles(this.mesh);

        this.scene = this.mesh.getScene();

        this.pointerDownObserver = this.scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                this.smokeParitcles.start();

                let pickedMesh = this.scene.pickWithRay(this.scene.activeCamera.getForwardRay(10)).pickedMesh;

                if (pickedMesh.id === "ExitDoor") {
                    // show the finish screen GUI
                    // play the finish GUI
                    // reset the scene
                }

            } else {
                this.smokeParitcles.stop();
            }
        })

    }

    detach(): void {
        this.scene.onPointerObservable.remove(this.pointerDownObserver);
        
    }

}
import { Scene, MeshBuilder, Vector3 } from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { IScene } from "../managers/scene/IScene";
import { InteractionManager } from "../managers/interactions/interactionManager";
import { InteractableBehavior } from "../behaviors/interactableBehavior";

export class HelloScene implements IScene {
    public name = "HelloScene";
    private scene: Scene;

    public async createScene(engine: Engine, interactionManager: InteractionManager, xrExperience: WebXRDefaultExperience): Promise<Scene> {
        this.scene = engine.scenes[engine.scenes.length - 1];
        
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 0.05 }, this.scene);
        sphere.position = new Vector3(0, 0, 0);
        
        const sphereIntB = new InteractableBehavior(interactionManager, {
            usePointerDrag: true,
            moveAttached: false
        });
        sphere.addBehavior(sphereIntB);

        const plane = MeshBuilder.CreateGround("ground", { width: 0.5, height: 0.5 }, this.scene);
        plane.position.y = -0.1;
        
        if (xrExperience) {
            xrExperience.teleportation.removeFloorMeshByName("Floor");
            const floorMesh = this.scene.getMeshByName("ground");
            if (floorMesh) {
                xrExperience.teleportation.addFloorMesh(floorMesh);
            }
        }
        
        return this.scene;
    }
}
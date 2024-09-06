import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene, ParticleHelper } from "@babylonjs/core";
import { FireMaterial } from "@babylonjs/materials";
import { FireBehavior } from "./FireBehavior";

export function startFire(scene: Scene): Mesh {

    const fireMaterial = new FireMaterial("fire");
    let emitter= MeshBuilder.CreateBox("emitter", {size: 0.5})

    emitter.parent = scene.getMeshById("ExitDoor");

    ParticleHelper.CreateAsync("fire", scene).then((set) => {
        emitter.isVisible=false
        // emitter.position= new Vector3(-4,3,-1.6)
        const fireBehavior = new FireBehavior();
        emitter.addBehavior(fireBehavior);        
        set.emitterNode=emitter;

        fireBehavior.onFireObservable.add((isRunning) => {
            if (!isRunning) {
                set.dispose();
            } else {
                set.start();
            }
        })
    });

    return emitter;
}
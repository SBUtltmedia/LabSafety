import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene, ParticleHelper } from "@babylonjs/core";
import { FireBehavior } from "./FireBehavior";

export function setupFires(scene: Scene): Mesh[] {
    let emitters = [];

    emitters.push(MeshBuilder.CreateBox("emitter1", {size: 0.5}));
    emitters.push(MeshBuilder.CreateBox("emitter2", {size: 0.5}));
    emitters.push(MeshBuilder.CreateBox("emitter3", {size: 0.5}));
    emitters.push(MeshBuilder.CreateBox("emitter4", {size: 0.5}));

    for (let emitter of emitters) {
        emitter.parent = scene.getMeshById("ExitDoor");    
    }

    emitters[0].position.copyFromFloats(0,0,0);
    emitters[1].position.copyFromFloats(0,0,2.5);
    emitters[2].position.copyFromFloats(-2,0,4);
    emitters[3].position.copyFromFloats(-4,0,4);

    for (let emitter of emitters) {
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
    }

    return emitters;
}
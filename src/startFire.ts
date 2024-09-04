import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene, ParticleHelper } from "@babylonjs/core";


export function startFire(scene: Scene): Mesh {

    ParticleHelper.CreateAsync("fire", scene).then((set) => {
        let emitter= MeshBuilder.CreateBox("emitter", {size: 0.5})
        emitter.isVisible=false
        emitter.position= new Vector3(-4,3,-1.6)
        set.emitterNode=emitter;
        set.start();
    });
}
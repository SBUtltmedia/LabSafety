import { Mesh, MeshBuilder, ParticleHelper, ParticleSystem, ParticleSystemSet, Scene, ShadowDepthWrapper,
     ShadowGenerator, SpotLight, Texture, Vector3 } from "@babylonjs/core";

import { FireMaterial } from "@babylonjs/materials"
import { log } from "./utils";

export class Fire {
    scene: Scene
    plane: Mesh
    position: Vector3 = new Vector3(-4.3, 0, -1.7);

    set: ParticleSystemSet

    constructor(scene: Scene) {
        this.scene = scene;
    }

    show() {
        ParticleHelper.CreateAsync("fire", this.scene).then((set) => {
            this.set = set;
            set.systems.forEach((system) => {
                system.emitter.x = -4;
                system.emitter.z = -1.7;
            })
            set.start();
        })
    }

    hide() {
        this.set.dispose();
    }
}
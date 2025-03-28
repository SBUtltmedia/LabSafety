import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { GPUParticleSystem } from "@babylonjs/core/Particles/gpuParticleSystem";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color4, MeshBuilder } from "@babylonjs/core";
import GUI from 'lil-gui'; 

export class SmokeParticles {
    particleSystem: ParticleSystem | GPUParticleSystem;
    #mesh: AbstractMesh;

    constructor(sourceMesh: AbstractMesh) {
        this.#mesh = sourceMesh;

        this.#setupParticleSystem();
    }

    #setupParticleSystem() {
        let scene = this.#mesh.getScene();

        let particleSystem: ParticleSystem | GPUParticleSystem;

        if (GPUParticleSystem.IsSupported) {
            console.log("Using the GPU for particle system")
            particleSystem = new ParticleSystem("particles", 150000, scene);
        } else {
            particleSystem = new ParticleSystem("particles", 100000 , scene);
        }

        particleSystem.particleTexture = new Texture("images/smokeParticleTexture2.png", scene);
    
        let x = 1, y = 1.5, z = x;

        particleSystem.color1 = new Color4(0.7,0.7,0.7, 0.3);
        particleSystem.color2 = particleSystem.color1;
        particleSystem.colorDead = new Color4(1,1,1, 0);

        particleSystem.renderingGroupId = 1;


        particleSystem.createPointEmitter(
            new Vector3(x, y, -z),
            new Vector3(-x, -y, z)
        )

        particleSystem.emitRate = 15000;

        const gui = new GUI();


        // // The particle system is now in the local space of the source mesh. Without this, the rotation and the position of the particle system would not change
        // // along with the source mesh (fire extinguisher in this case).
        let props = {

        };
        let gravity = new Vector3(0, 0, 90)
       let obj = { isLocal : true,

        gravity,

        // how long before the particles dispose
        minLifeTime : 0.2,
        maxLifeTime : 1,

        minSize : 0.05,
        maxSize : 0.05
        }

        let emitterSphere = MeshBuilder.CreateSphere("emitterSphere", {diameter: 0.05})
        emitterSphere.parent = this.#mesh.getChildMeshes().find(mesh => mesh.name === "Hose");
        console.log("hose: ", this.#mesh.getChildMeshes().find(mesh => mesh.name === "Hose"))

        emitterSphere.position = new Vector3(0, 0.08, 0);
        // emitterSphere.rotation = new Vector3(0, Math.PI/2, 0);

        emitterSphere.isVisible = false;

        for (let entry of Object.entries(obj)) {
            // @ts-ignore
            particleSystem[entry[0]] = entry[1];
            // gui.add(particleSystem, entry[0]);
        }
        // gui.add(particleSystem, obj["gravity"].x);
        console.log(Object.entries(particleSystem));


        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        particleSystem.emitter = emitterSphere;
        particleSystem.emitter.position.z += 0.1;

        this.particleSystem = particleSystem;
        // this.start();
    }

    start() {
        this.particleSystem.start();
    }

    stop() {
        // TODO: Find a way to let all the current particles disappear before stopping
        // to prevent black particles that don't look like foam on the screen.
        this.particleSystem.stop();
    }
}
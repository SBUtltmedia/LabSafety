import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { GPUParticleSystem } from "@babylonjs/core/Particles/gpuParticleSystem";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

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
            particleSystem = new ParticleSystem("particles", 15000, scene);
        } else {
            particleSystem = new ParticleSystem("particles", 10000 , scene);
        }

        particleSystem.particleTexture = new Texture("images/smokeParticleTexture.png", scene);
    
        let x = 0.25, y = 1, z = x;

        particleSystem.createPointEmitter(
            new Vector3(x, y, -z),
            new Vector3(-x, -y, z)
        )

        particleSystem.emitRate = 5000;


        // // The particle system is now in the local space of the source mesh. Without this, the rotation and the position of the particle system would not change
        // // along with the source mesh (fire extinguisher in this case).
        particleSystem.isLocal = true;

        particleSystem.gravity = new Vector3(0, 0, 100);

        // how long before the particles dispose
        particleSystem.minLifeTime = 0.7;
        particleSystem.maxLifeTime = 0.7;

        particleSystem.minSize = 0.05;
        particleSystem.maxSize = 0.35;


        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        particleSystem.emitter = this.#mesh as AbstractMesh;
        particleSystem.emitter.position.z += 0.1;

        this.particleSystem = particleSystem;
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
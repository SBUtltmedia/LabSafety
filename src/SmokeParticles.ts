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
            particleSystem = new GPUParticleSystem("particles", { capacity:15000 }, scene);
            particleSystem.activeParticleCount = 2700;
        } else {
            particleSystem = new ParticleSystem("particles", 2000 , scene);
        }

        particleSystem.particleTexture = new Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png", scene);
    
        particleSystem.emitRate = 170;

        particleSystem.createPointEmitter(new Vector3(-3.5, -3.5, 0), new Vector3(3.5,3.5, 0));

        particleSystem.gravity = new Vector3(0, 0, 20);

        // The particle system is now in the local space of the source mesh. Without this, the rotation and the position of the particle system would not change
        // along with the source mesh (fire extinguisher in this case).
        particleSystem.isLocal = true;

        // how long before the particles dispose
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.3;

        particleSystem.minEmitPower = 0.7;
        particleSystem.maxEmitPower = 0.5;

        particleSystem.minSize = 0.01;
        particleSystem.maxSize = 0.02;
     
        let gradientSize = 0.30;

        particleSystem.addSizeGradient(gradientSize, gradientSize, gradientSize);

        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        particleSystem.emitter = this.#mesh;

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
import { AbstractMesh, BoxParticleEmitter, Color3, Color4, GPUParticleSystem,  Mesh,  MeshBuilder, ParticleSystem, SolidParticleSystem, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";

export class SmokeParticles {
    particleSystem: ParticleSystem
    gravity: Vector3;

    constructor(sourceMesh: AbstractMesh) {
        let scene = sourceMesh.getScene();
        let camera = scene.activeCamera;

        this.gravity = Vector3.Zero();

        let particleSystem: ParticleSystem | GPUParticleSystem;

        if (GPUParticleSystem.IsSupported) {
            particleSystem = new GPUParticleSystem("particles", { capacity:15000 }, scene);
            particleSystem.activeParticleCount = 2000;
        } else {
            particleSystem = new ParticleSystem("particles", 2000 , scene); 
        }
            

        //Texture of each particle
        particleSystem.particleTexture = new Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png", scene);
    
        particleSystem.emitRate = 150;
    

        let pointEmitter = particleSystem.createPointEmitter(new Vector3(-3.5, -4, 0), new Vector3(3.5,4, 0));
        // coneEmitter.rotation.y = Math.PI / 2;

        particleSystem.gravity = new Vector3(0, 0, 10);

        particleSystem.isLocal = true;

        // how long before the particles dispose?
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.3;

        // how much "push" from the back of the rocket.
        // Rocket forward movement also (seemingly) effects "push", but not really.
        particleSystem.minEmitPower = 0.7;
        particleSystem.maxEmitPower = 0.5;

        particleSystem.minSize = 0.01;
        particleSystem.maxSize = 0.02;
     
        let gradientSize = 0.3;

        particleSystem.addSizeGradient(gradientSize, gradientSize, gradientSize);

        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        particleSystem.emitter = sourceMesh;
        
        this.particleSystem = particleSystem;
    }

    start() {
        this.particleSystem.start();
    }

    stop() {
        this.particleSystem.stop();
    }
}
import { BoxParticleEmitter, Color3, Color4, GPUParticleSystem, Mesh, MeshBuilder, ParticleSystem, SolidParticleSystem, Texture, Vector3 } from "@babylonjs/core";

export class SmokeParticles {
    particleSystem: ParticleSystem

    constructor(sourceMesh: Mesh) {
        let scene = sourceMesh.getScene();

        // var particleSystem = new ParticleSystem("particles", 5000, scene);

        let particleSystem;

        if (GPUParticleSystem.IsSupported) {
            particleSystem = new GPUParticleSystem("particles", { capacity:1000000 }, scene);
            particleSystem.activeParticleCount = 200000;
        } else {
            particleSystem = new ParticleSystem("particles", 5000 , scene);
        }
            

        //Texture of each particle
        particleSystem.particleTexture = new Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png", scene);
    
        particleSystem.emitRate = 200;
        particleSystem.particleEmitterType = new BoxParticleEmitter();

        particleSystem.gravity = new Vector3(-200, 0, 0);

        // how long before the particles dispose?
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 1;

        // how much "push" from the back of the rocket.
        // Rocket forward movement also (seemingly) effects "push", but not really.
        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 0.5;

        particleSystem.minSize = 0.01;
        particleSystem.maxSize = 0.01;

        // particleSystem.addColorGradient(0, new Color4(0.5, 0.5, 0.5, 0),  new Color4(0.8, 0.8, 0.8, 0));
        // particleSystem.addColorGradient(0.4, new Color4(0.1, 0.1, 0.1, 0.1), new Color4(0.4, 0.4, 0.4, 0.4));
        // particleSystem.addColorGradient(0.7, new Color4(0.03, 0.03, 0.03, 0.2), new Color4(0.3, 0.3, 0.3, 0.4));
        // particleSystem.addColorGradient(1.0, new Color4(0.0, 0.0, 0.0, 0), new Color4(0.03, 0.03, 0.03, 0));      
        
        let gradientSize = 0.5

        particleSystem.addSizeGradient(gradientSize, gradientSize, gradientSize);

        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;


        // adjust diections to aim out fat-bottom end of rocket, with slight spread.

        let dirConstant = 7;

        particleSystem.direction1 = new Vector3(dirConstant, dirConstant, dirConstant);
        particleSystem.direction2 = new Vector3(-dirConstant, -dirConstant, -dirConstant);
        particleSystem.emitter = sourceMesh;

        // rocket length 4, so move emission point... 2 units toward wide end of rocket.
        let emitBoxVector = new Vector3(0.3, 0.2, 0);
        particleSystem.minEmitBox = emitBoxVector;
        particleSystem.maxEmitBox = emitBoxVector;


        // a few colors, based on age/lifetime.  Yellow to red, generally speaking.
        // particleSystem.color1 = new Color3(0,0,0);
        // particleSystem.color2 = new Color3(1, .5, 0);
        // particleSystem.colorDead = new Color3(1, 0, 0);
        
        this.particleSystem = particleSystem;
    }

    start() {
        this.particleSystem.start();
    }

    stop() {
        this.particleSystem.stop();
    }
}
import { Color4, Mesh, MeshBuilder, ParticleSystem, SolidParticleSystem, Texture, Vector3 } from "@babylonjs/core";

export class SmokeParticles {
    particleSystem: ParticleSystem

    constructor(sourceMesh: Mesh) {
        let scene = sourceMesh.getScene();

        var particleSystem = new ParticleSystem("particles", 50000, scene);

        //Texture of each particle
        particleSystem.particleTexture = new Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png", scene);
    
        // lifetime
        particleSystem.minLifeTime = 2;
        particleSystem.maxLifeTime = 6;
    
        // emit rate
        particleSystem.emitRate = 5000;
    
        // gravity
        particleSystem.gravity = new Vector3(-200, 0, 0);
    
        // size gradient
        particleSystem.addSizeGradient(0.1, 0.75, 0.1);
        // particleSystem.addSizeGradient(0.3, 1, 2);
        // particleSystem.addSizeGradient(0.5, 2, 3);
        // particleSystem.addSizeGradient(1.0, 6, 8);
    
        // color gradient
        particleSystem.addColorGradient(0, new Color4(0.5, 0.5, 0.5, 0),  new Color4(0.8, 0.8, 0.8, 0));
        particleSystem.addColorGradient(0.4, new Color4(0.1, 0.1, 0.1, 0.1), new Color4(0.4, 0.4, 0.4, 0.4));
        particleSystem.addColorGradient(0.7, new Color4(0.03, 0.03, 0.03, 0.2), new Color4(0.3, 0.3, 0.3, 0.4));
        particleSystem.addColorGradient(1.0, new Color4(0.0, 0.0, 0.0, 0), new Color4(0.03, 0.03, 0.03, 0));
    
        // speed gradient
        particleSystem.addVelocityGradient(1,1,1);
        // particleSystem.addVelocityGradient(0.1, 0.8, 0.9);
        // particleSystem.addVelocityGradient(0.7, 0.4, 0.5);
        // particleSystem.addVelocityGradient(1, 0.1, 0.2);
    
        // rotation
        particleSystem.minInitialRotation = 0;
        particleSystem.maxInitialRotation = Math.PI;
        particleSystem.minAngularSpeed = -1;
        particleSystem.maxAngularSpeed = 1;
    
        // blendmode
        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        
        // emitter shape
        var sphereEmitter = particleSystem.createSphereEmitter(0.1);
    
        // Where the particles come from
        particleSystem.emitter = sourceMesh.position // the starting object, the emitter
        particleSystem.minEmitBox = new Vector3(-0.5, -0.5, -0.5); // Starting all from
        particleSystem.maxEmitBox = new Vector3(0.5, 0.5, 0.5);
        
        this.particleSystem = particleSystem;
    }

    start() {
        this.particleSystem.start();
    }

    stop() {
        this.particleSystem.stop();
    }
}
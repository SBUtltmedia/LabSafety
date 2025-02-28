import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color4 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";


export class CylinderSmokeBehavior implements Behavior<Mesh> {
    mesh: Mesh
    particleSystem: ParticleSystem;
    isRunning: Boolean;

    constructor(texture: Texture, mesh: Mesh) {
        this.mesh = mesh;
        this.particleSystem = new ParticleSystem("particles", 5000, this.mesh._scene);
        this.particleSystem.particleTexture = texture;
        this.isRunning = false;
    }

    init() {

    }

    get name() {
        return "smoke";
    }

    attach(target: Mesh): void {
        this.mesh = target;

        const liquidMesh = this.mesh.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid");
    
        this.particleSystem.minLifeTime = 0.7;
        this.particleSystem.maxLifeTime = 0.7;
        this.particleSystem.emitRate = 5000;
        this.particleSystem.gravity = new Vector3(0, 20, 0);
        this.particleSystem.minSize = 0.05;
        this.particleSystem.maxSize = 0.35;

        let x = 2.5, y = 10, z = x;

        this.particleSystem.createPointEmitter(
            new Vector3(-x, y, -z),
            new Vector3(x, y, z)
        )

        const targetColor = (liquidMesh.material as StandardMaterial).diffuseColor;

        this.particleSystem.addColorGradient(
            1,
            Color4.FromColor3(
                targetColor,
                1
            )
        );
        this.particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        this.particleSystem.emitter = (this.mesh as AbstractMesh).position;
        this.particleSystem.stop();
        this.isRunning = false;

        setTimeout(() => {
            this.startSystem();
        }, 500)
    }

    detach(): void {
        this.stopSystem();
        this.isRunning = false;
    }

    startSystem() {
        this.particleSystem.start();
        this.isRunning = true;
    }

    stopSystem() {
        this.particleSystem.stop();
        this.isRunning = false;
    }
}
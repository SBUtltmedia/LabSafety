import { FireMaterial } from "@babylonjs/materials";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { ShadowDepthWrapper } from "@babylonjs/core/Materials/shadowDepthWrapper";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { FireBehavior } from "./FireBehavior";

export function startFire(): Mesh {
    const fireMaterial = new FireMaterial("fire");
    fireMaterial.diffuseTexture = new Texture("images/fire.png");
    fireMaterial.distortionTexture = new Texture("images/distortion.png");
    fireMaterial.opacityTexture = new Texture("images/candleopacity.png");
    fireMaterial.speed = 5;

    const light = new SpotLight("spotlight", new Vector3(2, 2, 2), new Vector3(-1, -2, -1), 3, 1);
    const generator = new ShadowGenerator(10240, light);
    generator.usePercentageCloserFiltering = true;
    generator.bias = 100;
    generator.transparencyShadow = true;

    const plane = MeshBuilder.CreatePlane("fire-plane", { width: 4, height: 3 });
    plane.receiveShadows = true;

    // @todo: Hard-coded position, bad!
    plane.position.copyFromFloats(-4.1, 0, -1.6);
    plane.rotationQuaternion = null;
    plane.rotation.copyFromFloats(0, -Math.PI / 2, 0);

    plane.material = fireMaterial;
    plane.material.shadowDepthWrapper = new ShadowDepthWrapper(plane.material);
    generator.getShadowMap().renderList.push(plane);

    const fireBehavior = new FireBehavior();
    plane.addBehavior(fireBehavior);
    
    return plane;
}

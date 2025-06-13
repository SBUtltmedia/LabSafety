import { Color3, GlowLayer, MeshBuilder, RectAreaLight, Scene, StandardMaterial, Texture, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";

export function createPortal(scene: Scene) {
    let color = new Color3(0.01, 0.05, 0);

    let portalMat = new StandardMaterial("portalMat", scene);
    
    let plane = MeshBuilder.CreatePlane("portal", {
        width: 1,
        height: 3
    });

    portalMat.emissiveColor = color;
    portalMat.alpha = 1;

    plane.material = portalMat;

    plane.rotation.y = -Math.PI / 2;

    plane.position.copyFrom(scene.getMeshByName("ExitDoor").getAbsolutePosition());
    plane.position.x = - 4.2;
    plane.position.y = 1;
    plane.position.z = -1.67;

    plane.scaling.x = 0.7;
    plane.scaling.y = 0.6;

    let camera = scene.activeCamera;
    let engine = scene.getEngine();
    let godrays = new VolumetricLightScatteringPostProcess('godrays', 1.0, camera, plane, 100, Texture.BILINEAR_SAMPLINGMODE, engine, false);

    godrays._volumetricLightScatteringRTT.renderParticles = true;

    godrays.exposure = 0.1;
    godrays.decay = 0.96815;
    godrays.weight = 0.98767;
    godrays.density = 0.996;

    plane.isVisible = false;

}
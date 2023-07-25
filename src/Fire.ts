import { Mesh, MeshBuilder, Scene, ShadowDepthWrapper,
     ShadowGenerator, SpotLight, Texture, Vector3 } from "@babylonjs/core";

import { FireMaterial } from "@babylonjs/materials"

export class Fire {
    scene: Scene
    plane: Mesh

    constructor(scene: Scene) {
        this.scene = scene;

        var fire = new FireMaterial("fire", scene);
        fire.diffuseTexture = new Texture("images/fire.png", scene);
        fire.distortionTexture = new Texture("images/distortion.png", scene);
        fire.opacityTexture = new Texture("images/candleopacity.png", scene);
        fire.speed = 5.0;
        
        var light = new SpotLight("light", new Vector3(2, 2, 2), new Vector3(-1, -2, -1), 3, 1, scene);
        var generator = new ShadowGenerator(10240, light);
        generator.usePercentageCloserFiltering = true;
        generator.bias = 100;
        generator.transparencyShadow = true;   
    
            // plane = Mesh.CreatePlane("fireplane", 1.5, scene);
        let plane = MeshBuilder.CreatePlane("fireplane", {width: 28, height: 3}, scene);
    
        // var plane = scene.getMeshByName("Plane");
        plane.receiveShadows = true; 

        console.log(scene);
    
        plane.position = scene.getMeshByName("ExitDoor").getAbsolutePosition();
        plane.scaling.x = 0.1;
        plane.scaling.y = 0.7;
        plane.rotationQuaternion = null;
        plane.rotation.y = -Math.PI / 2;

        plane.position.x += 0.1;
        // plane.billboardMode = Mesh.BILLBOARDMODE_Y;
        plane.material = fire;
        plane.material.shadowDepthWrapper = new ShadowDepthWrapper(plane.material);
        generator.getShadowMap().renderList.push(plane);

        this.plane = plane;

        this.hide();
        
    }

    show() {
        this.plane.isVisible = true;
    }

    hide() {
        this.plane.isVisible = false;
    }
}
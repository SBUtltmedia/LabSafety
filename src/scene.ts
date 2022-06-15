import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Engine } from '@babylonjs/core/Engines/engine';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { AbstractMesh, BoundingInfo } from '@babylonjs/core';

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
import '@babylonjs/core/Rendering/boundingBoxRenderer';


function setBoundingInfoFromChildren(mesh: AbstractMesh): [Vector3, Vector3] {
    let minimum = mesh.position, maximum = mesh.position;
    mesh.getChildMeshes().forEach(childMesh => {
        const childBoundingBox = childMesh.getBoundingInfo().boundingBox;
        minimum = Vector3.Minimize(minimum, childBoundingBox.minimum);
        maximum = Vector3.Maximize(maximum, childBoundingBox.maximum);
    });
    mesh.setBoundingInfo(new BoundingInfo(minimum, maximum));
    return [minimum, maximum];
}

export const createScene = async (engine: Engine, canvas: HTMLCanvasElement) => {
    const scene = new Scene(engine);
    
    const camera = new ArcRotateCamera('camera', -Math.PI/2, Math.PI / 2.5, 3, new Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    const ground = CreateGround('ground', { width: 100, height: 100 });
    const groundMaterial = new StandardMaterial('ground-material', scene);
    groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;
    const groundLevel = ground.getBoundingInfo().boundingBox.maximum.y;

    SceneLoader.ImportMeshAsync('', '../models/', 'graduated_cylinder+liquid.glb').then(result => {
        const cylinder1 = result.meshes.find(m => m.name === '__root__')!;
        console.log(result.meshes);
        cylinder1.addBehavior(new PointerDragBehavior());
        
        // Determine bounding info from child meshes
        setBoundingInfoFromChildren(cylinder1);
        cylinder1.position.y += groundLevel - cylinder1.getBoundingInfo().minimum.y;
        
        // Clone mesh, sharing geometries
        // Note: cloning prefixes the clone's child meshes with `${childMesh.parent.name}.`
        const cylinder2 = cylinder1.clone('cylinder2', null)!;
        setBoundingInfoFromChildren(cylinder2);
        cylinder2.addBehavior(new PointerDragBehavior());
        cylinder2.position.x -= 5;
        
        // Set liquid colors
        const cylinder1Liquid = cylinder1.getChildMeshes().find(m => m.name === 'BeakerLiquid')!;
        const cylinder1LiquidMaterial = new StandardMaterial('liquid-material', scene);
        cylinder1LiquidMaterial.diffuseColor = new Color3(1, 0, 0);
        cylinder1Liquid.material = cylinder1LiquidMaterial;
        const cylinder2Liquid = cylinder2.getChildMeshes().find(m => m.name === `${m.parent!.name}.BeakerLiquid`)!;
        const cylinder2LiquidMaterial = new StandardMaterial('liquid-material', scene);
        cylinder2LiquidMaterial.diffuseColor = new Color3(0, 0, 1);
        cylinder2Liquid.material = cylinder2LiquidMaterial;

        cylinder1.rotationQuaternion = null;
        console.log(cylinder1.rotation);
        
        // scene.registerBeforeRender(() => {
        //     if (meshLiquid!.material!.alpha > 0) {
        //         meshLiquid!.material!.alpha -= 0.01;
        //     }
        // });
    });

    const xr = await scene.createDefaultXRExperienceAsync();
    return scene;
};

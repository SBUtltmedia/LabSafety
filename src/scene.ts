import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Engine } from '@babylonjs/core/Engines/engine';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import { Nullable } from '@babylonjs/core/types';

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
import '@babylonjs/core/Rendering/boundingBoxRenderer';


function setBoundingInfoFromChildren(mesh: AbstractMesh): [Vector3, Vector3] {
    const { min, max } = mesh.getHierarchyBoundingVectors();  // Note: this method works strangely with cloned meshes
    mesh.setBoundingInfo(new BoundingInfo(min, max));
    return [min, max];
}

function placeOnSurface(surface: AbstractMesh, ...meshes: AbstractMesh[]) {
    // Note: this function only changes the vertical position of the meshes, so a mesh may not be within the bounds of the surface.
    const surfaceLevel = surface.getBoundingInfo().boundingBox.maximum.y;
    meshes.forEach(mesh => {
        const offset = mesh.position.y - mesh.getBoundingInfo().boundingBox.minimum.y;
        mesh.position.y = surfaceLevel + offset;
    });
}

function showBoundingBoxes(...meshes: AbstractMesh[]) {
    meshes.forEach(mesh => mesh.showBoundingBox = true);
}

function hideBoundingBoxes(...meshes: AbstractMesh[]) {
    meshes.forEach(mesh => mesh.showBoundingBox = false);
}

export const createScene = async (engine: Engine, canvas: HTMLCanvasElement) => {
    const scene = new Scene(engine);
    
    const camera = new ArcRotateCamera('camera', -Math.PI/2, Math.PI / 2.5, 25, new Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    const ground = CreateGround('ground', { width: 100, height: 100 });
    const groundMaterial = new StandardMaterial('ground-material', scene);
    groundMaterial.diffuseColor = new Color3(1 , 228/255, 196/255);
    ground.material = groundMaterial;

    let cylinders: AbstractMesh[] = [];
    let table: Nullable<AbstractMesh> = null;

    SceneLoader.ImportMeshAsync('', '../models/', 'graduated_cylinder+liquid.glb').then(result => {
        const cylinder1 = result.meshes.find(mesh => mesh.name === '__root__')!;
        
        // Clone mesh, sharing geometries
        // Note: cloning prefixes the clone's child meshes with `${childMesh.parent.name}.`
        const cylinder2 = cylinder1.clone('cylinder2', null)!;
        const cylinderEmpty = cylinder1.clone('cylinder-empty', null)!;
        
        setBoundingInfoFromChildren(cylinder1);
        setBoundingInfoFromChildren(cylinder2);
        setBoundingInfoFromChildren(cylinderEmpty);

        cylinder1.addBehavior(new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) }));
        cylinder2.addBehavior(new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) }));
        
        // Set liquid colors
        const cylinder1Liquid = cylinder1.getChildMeshes().find(mesh => mesh.name === 'BeakerLiquid')!;
        const cylinder1LiquidMaterial = new StandardMaterial('liquid-material', scene);
        cylinder1LiquidMaterial.diffuseColor = new Color3(1, 0, 0);
        cylinder1Liquid.material = cylinder1LiquidMaterial;

        const cylinder2Liquid = cylinder2.getChildMeshes().find(mesh => mesh.name === `${mesh.parent!.name}.BeakerLiquid`)!;
        const cylinder2LiquidMaterial = new StandardMaterial('liquid-material', scene);
        cylinder2LiquidMaterial.diffuseColor = new Color3(0, 0, 1);
        cylinder2Liquid.material = cylinder2LiquidMaterial;

        const cylinderEmptyLiquid = cylinderEmpty.getChildMeshes().find(mesh => mesh.name === `${mesh.parent!.name}.BeakerLiquid`)!;
        const cylinderEmptyLiquidMaterial = new StandardMaterial('liquid-material', scene);
        cylinderEmptyLiquidMaterial.alpha = 0;
        cylinderEmptyLiquid.material = cylinderEmptyLiquidMaterial;
        
        // Set positions
        cylinders.push(cylinder1, cylinder2, cylinderEmpty);
        cylinders.forEach(c => console.log(c.rotation, c.rotationQuaternion));
        cylinder1.position.x += 5;
        cylinder2.position.x -= 5;
        cylinder1.rotationQuaternion = cylinder2.rotationQuaternion = cylinderEmpty.rotationQuaternion = null;
        cylinder1.rotation = new Vector3(0, Math.PI, 0);
        cylinder2.rotation = Vector3.Zero();
        cylinderEmpty.rotation = Vector3.Zero();

        if (table) placeOnSurface(table, ...cylinders);

        // Focus camera at the empty cylinder
        camera.setTarget(cylinderEmpty);
    });

    SceneLoader.ImportMeshAsync('', '../models/', 'newRoomEnvironmentTLL_draco.glb').then(result => {
        table = result.meshes.find(mesh => mesh.name === '__root__')!;
        setBoundingInfoFromChildren(table);
        
        if (cylinders.length) placeOnSurface(table, ...cylinders);
        
        table.rotationQuaternion = null;
        table.rotation.y = -Math.PI / 2;
    });

    //const xr = await scene.createDefaultXRExperienceAsync();
    return scene;
};

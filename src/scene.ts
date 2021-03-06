import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Engine } from '@babylonjs/core/Engines/engine';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
import '@babylonjs/core/Rendering/boundingBoxRenderer';
import '@babylonjs/core/Collisions/collisionCoordinator';

import { loadCylinders } from './loadCylinders';
import { loadRoom } from './loadRoom';


function placeOnSurface(surface: AbstractMesh, ...meshes: AbstractMesh[]) {
    // Note: this function only changes the vertical position of the meshes, so a mesh may not be within the bounds of the surface.
    const surfaceLevel = surface.getBoundingInfo().boundingBox.maximum.y;
    meshes.forEach(mesh => {
        const offset = mesh.position.y - mesh.getBoundingInfo().boundingBox.minimum.y + 0.01;  // The 0.01 is to prevent z-fighting; TODO: find a more elegant solution for this.
        mesh.position.y = surfaceLevel + offset;
    });
}

export const createScene = async (engine: Engine, canvas: HTMLCanvasElement) => {
    const scene = new Scene(engine);
    
    scene.gravity = new Vector3(0, -9.80665, 0);
    scene.collisionsEnabled = true;

    // const camera = new ArcRotateCamera('camera', -Math.PI/2, Math.PI / 2.5, 25, new Vector3(0, 0, 0), scene);
    const camera = new UniversalCamera('camera', new Vector3(0, 15, -10), scene);
    camera.keysUp.push(87);  // W
    camera.keysDown.push(83);  // S
    camera.keysLeft.push(65);  // A
    camera.keysRight.push(68);  // D
    camera.ellipsoid = new Vector3(1, 10, 1);
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.attachControl(canvas, true);

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    const ground = CreateGround('ground', { width: 100, height: 100 });
    const groundMaterial = new StandardMaterial('ground-material', scene);
    groundMaterial.diffuseColor = new Color3(1 , 228/255, 196/255);
    ground.material = groundMaterial;
    ground.checkCollisions = true;

    Promise.all([loadCylinders(), loadRoom()]).then(([cylinders, { room, table, walls, cabinet }]) => {
        placeOnSurface(table, ...Object.values(cylinders));
    });

    // const xr = await scene.createDefaultXRExperienceAsync();
    return scene;
};

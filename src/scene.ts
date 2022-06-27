import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Engine } from '@babylonjs/core/Engines/engine';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
import '@babylonjs/core/Rendering/boundingBoxRenderer';
import '@babylonjs/core/Collisions/collisionCoordinator';

import { loadCylinders } from './loadCylinders';
import { loadRoom } from './loadRoom';


function setBoundingInfoFromChildren(mesh: AbstractMesh): [Vector3, Vector3] {
    const { min, max } = mesh.getHierarchyBoundingVectors();  // Note: this method works strangely with cloned meshes
    mesh.setBoundingInfo(new BoundingInfo(min, max));
    return [min, max];
}

function placeOnSurface(surface: AbstractMesh, ...meshes: AbstractMesh[]) {
    // Note: this function only changes the vertical position of the meshes, so a mesh may not be within the bounds of the surface.
    const surfaceLevel = surface.getBoundingInfo().boundingBox.maximum.y;
    meshes.forEach(mesh => {
        const offset = mesh.position.y - mesh.getBoundingInfo().boundingBox.minimum.y + 0.01;  // The 0.01 is to prevent z-fighting; TODO: find a more elegant solution for this.
        mesh.position.y = surfaceLevel + offset;
    });
}

function showBoundingBoxes(...meshes: AbstractMesh[]) {
    meshes.forEach(mesh => mesh.showBoundingBox = true);
}

function hideBoundingBoxes(...meshes: AbstractMesh[]) {
    meshes.forEach(mesh => mesh.showBoundingBox = false);
}

const g = -9.80665;  // Standard gravity
function calculateCylinderPouringRotation(targetCylinder: AbstractMesh, pouringCylinder: AbstractMesh, r: number): Vector3 {
    const targetCylinderBoundingBox = targetCylinder.getBoundingInfo().boundingBox;
    const xTgt = (targetCylinderBoundingBox.minimumWorld.x + targetCylinderBoundingBox.maximumWorld.x) / 2;
    const yTgt = targetCylinderBoundingBox.maximumWorld.y;

    // Set the center of the pouring cylinder to be the origin. Variables oX and oY are poorly named; they should probably be xTgt and yTgt instead.
    const oX = xTgt - pouringCylinder.position.x;
    const oY = yTgt - pouringCylinder.position.y;
    // const oXNorm = oX/Math.sqrt(oX**2 + oY**2);
    const oYNorm = oY/Math.sqrt(oX**2 + oY**2);

    const numerator = oX ** 2;
    const denominator = 2 * r * (Math.asin(oYNorm) - r/2);
    const quotient = numerator/denominator;  // TODO: why is this negative?
    const root = Math.sqrt(Math.abs(quotient));
    const theta = Math.acos(root) + Math.PI/2;  // Note the Math.PI/2 offset.
    if (!Number.isFinite(theta) || Vector3.Distance(new Vector3(xTgt, yTgt, targetCylinder.position.z), pouringCylinder.position) < r) return Vector3.Zero();
    if (pouringCylinder.position.x < targetCylinder.position.x) return new Vector3(0, 0, -theta);
    return new Vector3(0, Math.PI, -theta);
}

export const createScene = async (engine: Engine, canvas: HTMLCanvasElement) => {
    const scene = new Scene(engine);
    
    scene.gravity = new Vector3(0, g, 0);
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

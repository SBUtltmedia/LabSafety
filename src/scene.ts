import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Engine } from '@babylonjs/core/Engines/engine';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import { Nullable } from '@babylonjs/core/types';
import { LinesMesh } from '@babylonjs/core/Meshes/linesMesh';

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
import '@babylonjs/core/Rendering/boundingBoxRenderer';
import '@babylonjs/core/Collisions/collisionCoordinator';


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

// interface Options {
//     points: Vector3[];
//     updatable?: boolean | undefined;
//     instance?: Nullable<LinesMesh> | undefined;
//     colors?: Color4[] | undefined;
//     useVertexAlpha?: boolean | undefined;
//     material?: Material | undefined;
// };
// function showTrajectory(startPoint: Vector3, endPoint: Vector3, f: (x: number) => number, options: Options): void {
//     const z = startPoint.z;
//     const xs: number[] = [startPoint.x];
//     const nLines = options.points.length - 1;
//     const inc = (endPoint.x - startPoint.x)/nLines;
//     for (let i = 1; i <= nLines - 1; ++i) {
//         xs.push(startPoint.x + i*inc);
//     }
//     xs.push(endPoint.x);
//     const points = xs.map(x => {
//         const y = f(x);
//         if (!Number.isFinite(y)) return new Vector3(x, x, z);
//         return new Vector3(x, y, z)
//     });
//     options.points = points;
//     console.log(`update points (nLines = ${nLines}): ${options.points.map(v => `(${v.x}, ${v.y})`)}`);
//     CreateLines('trajectory', options);
// }

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
    camera.ellipsoid = new Vector3(1, 8, 1);
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.attachControl(canvas, true);

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    const ground = CreateGround('ground', { width: 100, height: 100 });
    const groundMaterial = new StandardMaterial('ground-material', scene);
    groundMaterial.diffuseColor = new Color3(1 , 228/255, 196/255);
    ground.material = groundMaterial;
    ground.checkCollisions = true;

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
        cylinder1.position.x += 5;
        cylinder2.position.x -= 5;
        cylinder1.rotationQuaternion = cylinder2.rotationQuaternion = cylinderEmpty.rotationQuaternion = null;
        cylinder1.rotation = new Vector3(0, Math.PI, 0);
        cylinder2.rotation = Vector3.Zero();
        cylinderEmpty.rotation = Vector3.Zero();
        cylinders.forEach(cylinder => cylinder.getChildMeshes().find(mesh => mesh.name === 'BeakerwOpacity' || mesh.name === `${mesh.parent!.name}.BeakerwOpacity`)!.checkCollisions = true);
        // showBoundingBoxes(...cylinders);

        if (table) placeOnSurface(table, ...cylinders);

        // Focus camera at the empty cylinder
        // camera.setTarget(cylinderEmpty);
        const r = cylinderEmpty.getBoundingInfo().boundingBox.maximum.y - cylinderEmpty.position.y;
        // const options1: Options = {
        //     points: new Array(10).fill(Vector3.Zero()),
        //     updatable: true
        // };
        // const options2: Options = {
        //     points: new Array(10).fill(Vector3.Zero()),
        //     updatable: true
        // };
        cylinder1.rotationQuaternion = null;
        cylinder2.rotationQuaternion = null;
        cylinder1.rotation = new Vector3(0, 0, -Math.PI);
        cylinder2.rotation = new Vector3(0, 0, -Math.PI / 2);
        scene.registerBeforeRender(() => {
            cylinder1.rotationQuaternion = null;
            cylinder2.rotationQuaternion = null;
            const cylinder1Rotation = calculateCylinderPouringRotation(cylinderEmpty, cylinder1, r);
            const cylinder2Rotation = calculateCylinderPouringRotation(cylinderEmpty, cylinder2, r);
            cylinder1.rotation.x = cylinder1Rotation.x;
            cylinder1.rotation.y = cylinder1Rotation.y;
            cylinder1.rotation.z += (cylinder1Rotation.z - cylinder1.rotation.z) / 10;
            // cylinder1.rotation.addInPlace(cylinder1Rotation.subtract(cylinder1.rotation).divide(new Vector3(10, 10, 10)));
            // cylinder1.rotation = cylinder1Rotation;
            cylinder2.rotation.x = cylinder2Rotation.x;
            cylinder2.rotation.y = cylinder2Rotation.y;
            cylinder2.rotation.z += (cylinder2Rotation.z - cylinder2.rotation.z) / 10;
            // cylinder2.rotation.addInPlace(cylinder2Rotation.subtract(cylinder2.rotation).divide(new Vector3(10, 10, 10)));
            // cylinder2.rotation = cylinder2Rotation;

            // function f(pouringCylinder: AbstractMesh, targetCylinder: AbstractMesh): (x: number) => number {
            //     const theta = calculateCylinderPouringRotation(targetCylinder, pouringCylinder, r).z;
                // if (theta <= Math.PI || theta >= 2*Math.PI) return [theta, x => x];
            //     return function(x: number): number {
            //         // const y = (x - pouringCylinder.position.x)**2/(2*Math.tan(theta)*(1-pouringCylinder.position.x)) + pouringCylinder.position.y;
            //         const y = (Math.tan(theta) / (2 * r * Math.cos(theta))) * (x - pouringCylinder.position.x) ** 2 + (r / 2) * Math.sin(theta) + pouringCylinder.position.y;
            //         return y;
            //     };
            // }
            // const g = f(cylinder1, cylinderEmpty);
            // const h = f(cylinder2, cylinderEmpty);
            // showTrajectory(cylinder1.position, cylinderEmpty.position, g, options1);
            // showTrajectory(cylinder2.position, cylinderEmpty.position, h, options2);
        });
    });

    // SceneLoader.ImportMeshAsync('', '../models/', 'scienceLabInstructorTable.glb').then(result => {
    //     table = result.meshes.find(mesh => mesh.name === '__root__')!;
    //     setBoundingInfoFromChildren(table);
        
    //     if (cylinders.length) placeOnSurface(table, ...cylinders);
        
    //     table.rotationQuaternion = null;
    //     table.rotation.y = -Math.PI / 2;
    // });
    // const options: Options = {
    //     points: [new Vector3(10, 20, 0), new Vector3(0, 20, 0)],
    //     updatable: true,
    //     instance: undefined
    // };


    SceneLoader.ImportMeshAsync('', '../models/', 'newRoomEnvironmentTLL.glb').then(result => {
        const room = result.meshes.find(mesh => mesh.name === '__root__')!;
        console.log(result);
        table = result.meshes.find(mesh => mesh.name === 'Table.002')!;
        const walls = result.meshes.find(mesh => mesh.name === 'Walls')!;
        const cabinet = result.meshes.find(mesh => mesh.name === 'Cabinet')!;
        setBoundingInfoFromChildren(room);
        setBoundingInfoFromChildren(table);
        if (cylinders.length) placeOnSurface(table, ...cylinders);
        room.rotationQuaternion = null;
        room.rotation.y = -Math.PI / 2;
        room.position.z -= 15;

        table.checkCollisions = true;
        walls.checkCollisions = true;
        cabinet.checkCollisions = true;

    });

    const xr = await scene.createDefaultXRExperienceAsync();
    return scene;
};

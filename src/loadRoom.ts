import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

import { modelsPath } from './constants';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';


export const loadRoom = () => SceneLoader.ImportMeshAsync('', modelsPath, 'RoomandNewLabBench.glb').then(result => {
    const root = result.meshes.find(mesh => mesh.name === '__root__')!;
    const table = result.meshes.find(mesh => mesh.name === 'Table')!;
    const walls = result.meshes.find(mesh => mesh.name === 'Walls')!;
    const cabinet = result.meshes.find(mesh => mesh.name === 'Cabinet')!;
    const floor = result.meshes.find(mesh => mesh.name === 'WallsAndFloor.001')!;
    
    table.name = 'table';
    walls.name = 'walls';
    cabinet.name = 'cabinet';
    floor.name = 'floor';

    // root.rotationQuaternion = null;
    // root.rotation.y = -Math.PI / 2;
    // root.position = new Vector3(0, root.position.y - floor.position.y, 3);

    table.checkCollisions = true;
    walls.checkCollisions = true;
    cabinet.checkCollisions = true;
    floor.checkCollisions = true;
    
    (root as Mesh).bakeCurrentTransformIntoVertices();

    return { root, table, walls, cabinet, floor };
});

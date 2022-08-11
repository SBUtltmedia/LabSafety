import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

import { rootPath } from './constants';


export const loadRoom = () => SceneLoader.ImportMeshAsync('', `${rootPath}models/`, 'RoomandNewLabBench.glb').then(result => {
    const root = result.meshes.find(mesh => mesh.name === '__root__')!;
    const table = result.meshes.find(mesh => mesh.name === 'Table')!;
    const walls = result.meshes.find(mesh => mesh.name === 'Walls')!;
    const cabinet = result.meshes.find(mesh => mesh.name === 'Cabinet')!;
    const floor = result.meshes.find(mesh => mesh.name === 'WallsAndFloor.001')!;

    const wallsBoundingBox = walls.getBoundingInfo().boundingBox;
    const ceiling = CreatePlane('ceiling', {
        width: wallsBoundingBox.maximum.x - wallsBoundingBox.minimum.x,
        height: wallsBoundingBox.maximum.z - wallsBoundingBox.minimum.z
    });
    const ceilingMaterial = new StandardMaterial('ceiling-material');
    ceiling.material = ceilingMaterial;
    ceiling.setParent(root);
    ceiling.rotation = new Vector3(-Math.PI / 2, 0, 0);
    ceiling.position.y = wallsBoundingBox.maximum.y;
    
    table.name = 'table';
    walls.name = 'walls';
    cabinet.name = 'cabinet';
    floor.name = 'floor';

    table.checkCollisions = true;
    walls.checkCollisions = true;
    cabinet.checkCollisions = true;
    floor.checkCollisions = true;

    return { root, table, walls, cabinet, floor };
});

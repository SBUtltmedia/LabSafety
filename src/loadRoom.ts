import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

import { setBoundingInfoFromChildren } from "./utils";


export const loadRoom = () => SceneLoader.ImportMeshAsync('', 'models/', 'newRoomEnvironmentTLL.glb').then(result => {
    const room = result.meshes.find(mesh => mesh.name === '__root__')!;
    const table = result.meshes.find(mesh => mesh.name === 'Table.002')!;
    const walls = result.meshes.find(mesh => mesh.name === 'Walls')!;
    const cabinet = result.meshes.find(mesh => mesh.name === 'Cabinet')!;
    
    table.name = 'table';
    walls.name = 'walls';
    cabinet.name = 'cabinet';

    [room, table, walls, cabinet].forEach(setBoundingInfoFromChildren);

    room.rotationQuaternion = null;
    room.rotation.y = -Math.PI / 2;
    room.position.z -= 15;

    table.checkCollisions = true;
    walls.checkCollisions = true;
    cabinet.checkCollisions = true;

    return { room, table, walls, cabinet };
});

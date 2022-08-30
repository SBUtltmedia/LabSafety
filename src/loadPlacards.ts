import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { PLACARD_MESH_NAME, rootPath } from './constants';

export const loadPlacards = () => SceneLoader.ImportMeshAsync('', `${rootPath}models/`, 'Placard.glb').then(result => {
    const rootA = result.meshes.find(mesh => mesh.name === '__root__')!;
    rootA.name = 'a-placard';

    const rootB = rootA.clone('b-placard', null)!;
    const rootC = rootA.clone('c-placard', null)!;
    const placards = [rootA, rootB, rootC];
    placards.forEach(root => root.getChildMeshes()[0].name = PLACARD_MESH_NAME);  // There is only one child mesh

    rootA.rotationQuaternion = null;
    rootB.rotationQuaternion = null;
    rootC.rotationQuaternion = null;

    rootA.rotation = new Vector3(0, Math.PI / 2, 0);
    rootB.rotation = new Vector3(0, Math.PI / 2, 0);
    rootC.rotation = new Vector3(0, Math.PI / 2, 0);

    return placards;
});

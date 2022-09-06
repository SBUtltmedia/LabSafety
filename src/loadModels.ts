import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Texture, StandardMaterial, ISceneLoaderAsyncResult } from '@babylonjs/core';
import { rootPath, GrabbableAbstractMesh } from './constants';

// export const loadModels = (models:[string]) =>
// Promise.all(models.map(model=>
// SceneLoader.ImportMeshAsync('', `${rootPath}models/`, model).then(result=>result.meshes.find(mesh => mesh.name === '__root__'))
// ))
function nyfunc(foo = "bar") {

}


// class model {
//     fileName: string = 'table.glb';
//     callback ? : Function = result=>result.meshes.find(mesh => mesh.name === '__root__');

//     // Pass in this class as the required params
//     constructor(params: model) {
//         // object.assign will overwrite defaults if params exist
//         Object.assign(this, params)
//     }
// }

export interface model {
    fileName: string;
    callback?: (result: ISceneLoaderAsyncResult) => AbstractMesh;


}


export const loadModels = (models: model[]) => {
    const defaultCallback = (result: ISceneLoaderAsyncResult) => result.meshes.find(mesh => mesh.name === '__root__')!
    Promise.all(models.map(
        (currentmodel: model) => {
            if (!currentmodel.callback) {
                currentmodel.callback = defaultCallback;
            }
            console.log(currentmodel)
            let { fileName, callback = (result: any) => result } = currentmodel;
            return SceneLoader.ImportMeshAsync('', `${rootPath}models/`, fileName).then(callback)
        }
    ))}

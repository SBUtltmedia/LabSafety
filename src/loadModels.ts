import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import {   Texture, StandardMaterial} from '@babylonjs/core';
import { rootPath, GrabbableAbstractMesh } from './constants';

export const loadModels = (models:[string]) =>
Promise.all(models.map(model=>
SceneLoader.ImportMeshAsync('', `${rootPath}models/`, model).then(result=>result.meshes.find(mesh => mesh.name === '__root__'))
))



// class model {
//     fileName: string = 'table.glb';
//     callback ? : Function;

//     // Pass in this class as the required params
//     constructor(params: model) {
//         // object.assign will overwrite defaults if params exist
//         Object.assign(this, params)
//     }
// }
// export const loadModels = (models:[model]) =>
// Promise.all(models.map(
//     (currentmodel:model)=>{
//         console.log(currentmodel)
//         let {fileName,callback= (result:any)=>result}=currentmodel;
// SceneLoader.ImportMeshAsync('', `${rootPath}models/`, fileName).then(result=>result)
//     }
// ))

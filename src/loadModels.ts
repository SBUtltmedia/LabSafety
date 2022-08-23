import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import {   Texture, StandardMaterial} from '@babylonjs/core';
import { rootPath, GrabbableAbstractMesh } from './constants';

export const loadModels = (models:[string]) =>
Promise.all(models.map(model=>{
SceneLoader.ImportMeshAsync('', `${rootPath}models/`, model).then(result=>result.meshes.find(mesh => mesh.name === '__root__'))
})).then(result=>console.log(result))

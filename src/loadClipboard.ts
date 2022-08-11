import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import {   Texture, StandardMaterial} from '@babylonjs/core';
import { rootPath, GrabbableAbstractMesh } from './constants';

export const loadClipboard = () => SceneLoader.ImportMeshAsync('', `${rootPath}models/`, 'clipBoardWithPaperCompressedTexture.glb').then(result => {
    const clipboard = result.meshes.find(mesh => mesh.name === 'Plane')!;
    fetch(`${rootPath}images/SOP.svg`)
    .then(r => r.text())
    .then(text => {
        domToMaterial(text);
    })
    .catch(console.error.bind(console));
    const scene = clipboard.getScene();

   function domToMaterial(text: string){
  

        const svg = text;
        const buffer = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    
        // const texture = Texture.LoadFromDataString("tex", buffer, scene, undefined, undefined, undefined,Texture.NEAREST_SAMPLINGMODE);
        const texture = Texture.LoadFromDataString("tex", buffer, scene);
        let material = new StandardMaterial("mat", scene);
    
        material.diffuseTexture = texture;
        texture.uScale = 1.0;
        texture.vScale = -1.0;
        material.emissiveColor = Color3.White();
        material.useAlphaFromDiffuseTexture = true;
        texture.hasAlpha = true;
        clipboard.material = material;
   }
   return result.meshes.find(mesh => mesh.name === '__root__')!;
});

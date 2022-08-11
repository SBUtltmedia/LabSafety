import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import {   MeshBuilder,DynamicTexture, Texture ,PBRMaterial,StandardMaterial} from '@babylonjs/core';
import { rootPath, GrabbableAbstractMesh } from './constants';

export const loadClipboard = (scene:any) => SceneLoader.ImportMeshAsync('', `${rootPath}models/`, 'clipBoardWithPaperCompressedTexture.glb').then(result => {
    const clipboard = result.meshes.find(mesh => mesh.name === 'Plane')!;
    fetch(`${rootPath}images/SOP.svg`)
    .then(r => r.text())
    .then(text => {
        const el = document.createElement('div');
        el.setAttribute("id", "sopHolder");
        el.innerHTML = text;
        document.body.appendChild(el);
        domToMaterial();
    })
    .catch(console.error.bind(console));

   function domToMaterial(){
  

   const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#ff0000" d="M0 96C0 60.65 28.65 32 64 32H384C419.3 32 448 60.65 448 96V416C448 451.3 419.3 480 384 480H64C28.65 480 0 451.3 0 416V96z"/></svg>`;

    const buffer = 'data:image/svg+xml;utf8,' + encodeURIComponent(document.getElementById('sopHolder')!.innerHTML);
    const texture = Texture.LoadFromDataString(`tex`, buffer, scene);

    let material = new StandardMaterial("mat", scene);
   
    material.diffuseTexture = texture;
    texture.uScale = 1.0;
    texture.vScale = 1.0;
    material.emissiveColor = Color3.White();
    material.useAlphaFromDiffuseTexture = true;
    texture.hasAlpha = true;
    clipboard.material = material;


   }
   
});

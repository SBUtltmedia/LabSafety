import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import {   Texture, StandardMaterial} from '@babylonjs/core';
import { rootPath, GrabbableAbstractMesh } from './constants';

export const loadClipboard = () => SceneLoader.ImportMeshAsync('', `${rootPath}models/`, 'clipBoardWithPaperCompressedTexture.glb').then(result => {
    const clipboard = result.meshes.find(mesh => mesh.name === 'Plane')!;
    let sopObject = {procedure: [[]]}
    // fetch(`${rootPath}images/sop42.svg`)
    // .then(r => r.text())
    // .then(text => { 
    //     let svgFrag = fragmentFromString(text); // returns DOM object
    //     let procedureEL = svgFrag.getElementById("procedure-list")!;
    //     let newOL = document.createElement("ol");
    //     let newLI = document.createElement("li");
    //     newLI.innerHTML = "Heyyo";
    //     newOL.append(newLI);
    //     procedureEL.innerHTML = "";
    //     procedureEL.append(newOL);
    //     const serializer = new XMLSerializer();
    //     const document_fragment_string = serializer.serializeToString(svgFrag);
    //     domToMaterial(document_fragment_string);
    // })
    // .catch(console.error.bind(console));
    const scene = clipboard.getScene();

    function fragmentFromString (stringHTML: string) {
        let temp = document.createElement('template');
        temp.innerHTML = stringHTML;
        return temp.content;
    }
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

import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DynamicTexture,StandardMaterial,MeshBuilder } from '@babylonjs/core'
import { PLACARD_MESH_NAME, rootPath } from './constants';

export const loadPlacards = () => SceneLoader.ImportMeshAsync('', `${rootPath}models/`, 'Placard.glb').then(result => {
    const rootA = result.meshes.find(mesh => mesh.name === '__root__')!;
    const scene = rootA.getScene();
    rootA.name = 'a-placard';
    const placards = [rootA,  rootA.clone('b-placard', null)!, rootA.clone('c-placard', null)!];
    placards.forEach(placardRoot => 
        {    
      
        
 
       // var plane = MeshBuilder.CreatePlane("plane",  {width:.1, height:.1}, scene);
      
        const placard= placardRoot.getChildMeshes()[0];
        //placard.addChild(plane); 
        placard.name = PLACARD_MESH_NAME;  // There is only one child mesh
        var texture = new DynamicTexture("dynamic texture", {width:512, height:256}, scene);  
        // texture.uScale = 1.0;
         //texture.uScal//e = -.1;   
        var material = new StandardMaterial("Mat", scene);    				
        material.diffuseTexture = texture;
        placard.material = material; 
        var font = "bold 88px monospace";
        texture.drawText(placardRoot.name.split("-")[0], 225, 60, font, "green", "white", true, true);
        placard.rotationQuaternion = null;
        placard.rotation = new Vector3(0, -Math.PI / 2,0);
        });    
    return placards;
});

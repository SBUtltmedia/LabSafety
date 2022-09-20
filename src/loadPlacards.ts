import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DynamicTexture,StandardMaterial,MeshBuilder } from '@babylonjs/core'
import { PLACARD_MESH_NAME, rootPath } from './constants';

export const loadPlacards = () => SceneLoader.ImportMeshAsync('', `${rootPath}models/`, 'Placard_label.glb').then(result => {
    const rootA = result.meshes.find(mesh => mesh.name === '__root__')!;
    const scene = rootA.getScene();
    rootA.name = 'a-placard';
    const placards = [rootA,  rootA.clone('b-placard', null)!, rootA.clone('c-placard', null)!];
    placards.forEach(placardRoot => 
        {    
   
        
 
       // var plane = MeshBuilder.CreatePlane("plane",  {width:.1, height:.1}, scene);
      
        const label= placardRoot.getChildMeshes()[1];
        const placard= placardRoot.getChildMeshes()[0];
        //placard.addChild(plane); 
        placard.name = PLACARD_MESH_NAME;  // There is only one child mesh
        var texture = new DynamicTexture("dynamic texture", 256, scene);  
       texture.wAng = -Math.PI/2;
       texture.uAng = Math.PI;
        //texture.uScale=.52;  
        var material = new StandardMaterial("Mat", scene);    				
        material.diffuseTexture = texture;
        label.material = material; 
        var font = "bold 220px monospace";
        texture.drawText(placardRoot.name.split("-")[0].toUpperCase(),65, 185, font, "black", "white");
        placard.addChild(label);
        placard.rotationQuaternion = null;
        placard.rotation = new Vector3(0, Math.PI / 2,0);
        });    
    return placards;
});

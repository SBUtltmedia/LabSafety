import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

import { rootPath, GrabbableAbstractMesh, CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME, CYLINDER_A_NAME, CYLINDER_C_NAME, CYLINDER_B_NAME } from './constants';
import { getChildMeshByName } from './utils';
import { pourableTargets } from './globals';

export const loadCylinders = () => SceneLoader.ImportMeshAsync('', `${rootPath}models/`, 'TLLGraduatedCylinder.glb').then(result => {
    const cylinderA = result.meshes.find(mesh => mesh.name === '__root__')!;
    cylinderA.name = CYLINDER_A_NAME;
        
        // Clone mesh, sharing geometries
        // Note: cloning prefixes the clone's child meshes with `${childMesh.parent.name}.`
        const cylinderC = cylinderA.clone(CYLINDER_C_NAME, null)!;
        const cylinderB = cylinderA.clone(CYLINDER_B_NAME, null)!;
        const cylinders = [cylinderA, cylinderC, cylinderB];
        cylinders.forEach(cylinder => {
            cylinder.getChildMeshes().forEach(childMesh => {
                switch (childMesh.name.split('.').at(-1)!) {
                    case 'BeakerwOpacity':
                        childMesh.name = CYLINDER_MESH_NAME;
                        break;
                    case 'BeakerLiquid':
                        childMesh.name = CYLINDER_LIQUID_MESH_NAME;
                        break;
                }
            });
        });
        [[cylinderA, new Color3(1, 0, 0)],
         [cylinderC, new Color3(0, 0, 1)],
         [cylinderB, new Color3(0, 1, 0)]].forEach(([cylinder, color]) => {
            const pointerDragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) });
            pointerDragBehavior.updateDragPlane = false;
            pointerDragBehavior.useObjectOrientationForDragging = false;
            (cylinder as AbstractMesh).addBehavior(pointerDragBehavior);
            const cylinderLiquid = getChildMeshByName(cylinder as AbstractMesh, CYLINDER_LIQUID_MESH_NAME)!;
            const cylinderLiquidMaterial = new StandardMaterial('liquid-material');
            cylinderLiquidMaterial.diffuseColor = color as Color3;
            cylinderLiquid.material = cylinderLiquidMaterial;
        });

        cylinderA.rotationQuaternion = null;
        cylinderC.rotationQuaternion = null;
        cylinderB.rotationQuaternion = null;
        
        cylinders.forEach(cylinder => {
            const cylinderMesh = getChildMeshByName(cylinder, CYLINDER_MESH_NAME)! as GrabbableAbstractMesh;
            cylinderMesh.checkCollisions = true;
            cylinderMesh.grabbable = true;
        });

        pourableTargets.push(...cylinders);
        
        return {
            cylinderA,
            cylinderC,
            cylinderB
        };
});

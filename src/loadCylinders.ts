import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

import { setBoundingInfoFromChildren } from './utils';
import PouringBehavior from './PouringBehavior';
import { modelsPath } from './constants';

export const loadCylinders = () => SceneLoader.ImportMeshAsync('', modelsPath, 'graduated_cylinder+liquid.glb').then(result => {
    const leftCylinder = result.meshes.find(mesh => mesh.name === '__root__')!;
    leftCylinder.name = 'left-cylinder';
        
        // Clone mesh, sharing geometries
        // Note: cloning prefixes the clone's child meshes with `${childMesh.parent.name}.`
        const rightCylinder = leftCylinder.clone('right-cylinder', null)!;
        const staticCylinder = leftCylinder.clone('static-cylinder', null)!;
        const cylinders = [leftCylinder, rightCylinder, staticCylinder];
        cylinders.forEach(cylinder => {
            setBoundingInfoFromChildren(cylinder);
            cylinder.getChildMeshes().forEach(childMesh => {
                switch (childMesh.name.split('.').at(-1)!) {
                    case 'BeakerwOpacity':
                        childMesh.name = 'cylinder';
                        break;
                    case 'BeakerLiquid':
                        childMesh.name = 'liquid';
                        break;
                }
            });
        });
        [[leftCylinder, new Color3(1, 0, 0)],
         [rightCylinder, new Color3(0, 0, 1)]].forEach(([cylinder, color]) => {
            const pointerDragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) });
            pointerDragBehavior.updateDragPlane = false;
            (cylinder as AbstractMesh).addBehavior(pointerDragBehavior);
            const cylinderLiquid = (cylinder as AbstractMesh).getChildMeshes().find(mesh => mesh.name === 'liquid')!;
            const cylinderLiquidMaterial = new StandardMaterial('liquid-material');
            cylinderLiquidMaterial.diffuseColor = color as Color3;
            cylinderLiquid.material = cylinderLiquidMaterial;
        });

        const cylinderEmptyLiquid = staticCylinder.getChildMeshes().find(mesh => mesh.name === 'liquid')!;
        const cylinderEmptyLiquidMaterial = new StandardMaterial('liquid-material');
        cylinderEmptyLiquidMaterial.alpha = 0;
        cylinderEmptyLiquidMaterial.diffuseColor = Color3.Black();
        cylinderEmptyLiquid.material = cylinderEmptyLiquidMaterial;

        // Set positions
        leftCylinder.position.x += 5;
        rightCylinder.position.x -= 5;

        leftCylinder.rotationQuaternion = null;
        rightCylinder.rotationQuaternion = null;
        staticCylinder.rotationQuaternion = null;
        
        leftCylinder.rotation = new Vector3(0, Math.PI, 0);
        rightCylinder.rotation = Vector3.Zero();
        staticCylinder.rotation = Vector3.Zero();
        
        cylinders.forEach(cylinder => cylinder.getChildMeshes().find(mesh => mesh.name === 'cylinder')!.checkCollisions = true);
        const r = (staticCylinder.getBoundingInfo().boundingBox.maximum.y - staticCylinder.getBoundingInfo().boundingBox.minimum.y) / 2;
        leftCylinder.addBehavior(new PouringBehavior(staticCylinder, r));
        rightCylinder.addBehavior(new PouringBehavior(staticCylinder, r));
        
        return {
            leftCylinder,
            rightCylinder,
            staticCylinder
        };
});

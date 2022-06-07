import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Engine } from '@babylonjs/core/Engines/engine';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CannonJSPlugin } from '@babylonjs/core/Physics';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor';
import { PhysicsJoint } from '@babylonjs/core/Physics/physicsJoint';

import '@babylonjs/core/Physics/physicsEngineComponent';  // To populate the scene.enablePhysics method
import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience


export const createScene = async (engine: Engine, canvas: HTMLCanvasElement) => {
    const scene = new Scene(engine);

    // Enable Cannon physics engine
    scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin());  // TODO: this line causes an error with an undefined message
    
    // Add a camera
    const camera = new ArcRotateCamera('camera', -Math.PI/2, Math.PI / 2.5, 3, new Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    // Add lights
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    // My code
    // const ground = CreateGround('ground', { width: 10, height: 10 });
    // SceneLoader.ImportMeshAsync('', '../models/', 'fireAlarm.glb').then(result => {
    //     const mesh = result.meshes.find(m => m.name === '__root__')!;
    //     console.log(result);
    //     // The origin of realLeverFinal is the pivot point
    //     const lever = result.meshes.find(m => m.name === 'realLeverFinal')!;
    //     lever.rotationQuaternion = null;
    //     lever.rotation = new Vector3(0, 0, 0);
    //     scene.registerBeforeRender(() => {
    //         lever.position = Vector3.Zero()
    //     });
    //     lever.addBehavior(new PointerDragBehavior());
    //     // const joint = new PhysicsJoint(PhysicsJoint.HingeJoint, {
    //     //     collision: true,
    //     //     mainAxis: new Vector3(0, 0, 0),
    //     //     connectedAxis: new Vector3(0, 0, 0),
    //     //     mainPivot: mesh.position.negate(),
    //     //     connectedPivot: mesh.position.negate()
    //     // });
    // });

    SceneLoader.ImportMeshAsync('', '../models/', 'graduated_cylinder+liquid.glb').then(result => {
        const mesh = result.meshes.find(m => m.name === '__root__')!;
        // new PhysicsImpostor(mesh, PhysicsImpostor.CylinderImpostor, { mass: 1 }, scene);
        mesh.addBehavior(new PointerDragBehavior());

        // Move mesh to ground level
        let minY = 0;
        mesh.getChildMeshes().forEach(childMesh => {
            const childMinY = childMesh.getBoundingInfo().boundingBox.minimum.y;
            if (childMinY < minY) minY = childMinY;
        });
        mesh.position.y -= minY;
        
        // Clone mesh, sharing geometries
        // Note: cloning prefixes the clone's child meshes with `${childMesh.parent.name}.`
        const clone = mesh.clone('cylinder2', null)!;
        clone.addBehavior(new PointerDragBehavior());
        clone.position.x -= 2;

        // Set liquid colors
        const meshLiquid = mesh.getChildMeshes().find(m => m.name === 'BeakerLiquid');
        if (meshLiquid) {
            const liquidMaterial = new StandardMaterial('liquid-material', scene);
            liquidMaterial.diffuseColor = new Color3(1, 0, 0);
            meshLiquid.material = liquidMaterial;
        }
        const cloneLiquid = clone.getChildMeshes().find(m => m.name === `${m.parent!.name}.BeakerLiquid`);
        if (cloneLiquid) {
            const liquidMaterial = new StandardMaterial('liquid-material', scene);
            liquidMaterial.diffuseColor = new Color3(0, 0, 1);
            cloneLiquid.material = liquidMaterial;
        }

        mesh.rotationQuaternion = null;
        clone.rotationQuaternion = null;
        scene.registerBeforeRender(() => {
            mesh.rotation.x = 3 - Vector3.Distance(mesh.position, Vector3.Zero());
        });
    });

    // SceneLoader.ImportMeshAsync('', '../models/', 'clipboard.glb').then(result => {
    //     const mesh = result.meshes.find(mesh => mesh.name === '__root__');
    //     if (mesh) {
    //         mesh.position.z += 3;
    //         // Set rotation
    //         mesh.rotationQuaternion = null;
    //         mesh.rotation = new Vector3(0, Math.PI/2, 0);

    //         mesh.addBehavior(new PointerDragBehavior());
    //     }
    // });

    // SceneLoader.ImportMeshAsync('', '../models/room.glb').then(result => {
    //     const mesh = result.meshes.find(mesh => mesh.name === '__root__');
    //     if (mesh) {
    //         mesh.scaling = new Vector3(10, 10, 10);
    //     }
    //     console.log(result);
    // });
    const xr = await scene.createDefaultXRExperienceAsync();
    return scene;
};

import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Engine } from '@babylonjs/core/Engines/engine';
import { WebXRState } from '@babylonjs/core/XR';
import { WebXRFeatureName } from '@babylonjs/core/XR';
import { Sound } from '@babylonjs/core/Audio/sound';

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
import '@babylonjs/core/Rendering/boundingBoxRenderer';  // To render bounding boxes
import '@babylonjs/core/Collisions/collisionCoordinator';  // To enable collisions
import '@babylonjs/core/Audio/audioSceneComponent';

import { loadCylinders } from './loadCylinders';
import { loadClipboard} from './loadClipboard';
import { loadRoom } from './loadRoom';
import enableXRGrab from './enableXRGrab';
import PouringBehavior from './PouringBehavior';
import { sop } from './globals';
import { rootPath } from './constants';
import { calculateNearestOffset } from './utils';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';


// function placeOnSurface(surface: AbstractMesh, ...meshes: AbstractMesh[]) {
//     // Note: this function only changes the vertical position of the meshes, so a mesh may not be within the bounds of the surface.
//     const surfaceLevel = surface.getBoundingInfo().boundingBox.maximumWorld.y;
//     meshes.forEach(mesh => {
//         const offset = mesh.position.y - mesh.getBoundingInfo().boundingBox.minimumWorld.y + 0.01;  // The 0.01 is to prevent z-fighting; TODO: find a more elegant solution for this.
//         mesh.position.y = surfaceLevel + offset;
//         console.log(`placed ${mesh.name} on ${surface.name}`);
//         console.log(surfaceLevel + offset);
//     });
// }

// function placeCylinders(table: AbstractMesh, cylinders: AbstractMesh[]) {
//     const tableBoundingBox = table.getBoundingInfo().boundingBox;
//     const z = (tableBoundingBox.minimumWorld.z + tableBoundingBox.maximumWorld.z) / 2;
//     const y = tableBoundingBox.maximumWorld.y;
//     const xStatic = (tableBoundingBox.minimumWorld.x + tableBoundingBox.maximumWorld.x) / 2;
//     const xLeft = (tableBoundingBox.minimumWorld.x + xStatic) / 2;
//     const xRight = (xStatic + tableBoundingBox.maximumWorld.x) / 2;
// }

// function printOnHand(handMenu: NearMenu, s: string) {
//     const button = new TouchHolographicButton();
//     button.text = s;
//     button.isVisible = true;
//     handMenu.addButton(button);
// }

export const createScene = async (engine: Engine, canvas: HTMLCanvasElement) => {
    const scene = new Scene(engine);
    
    scene.gravity = new Vector3(0, -9.80665, 0);
    scene.collisionsEnabled = true;

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    
    const camera = new UniversalCamera('camera', new Vector3(0, 1.8, -2), scene);
    camera.speed = 0.2;
    camera.keysUp.push(87);  // W
    camera.keysDown.push(83);  // S
    camera.keysLeft.push(65);  // A
    camera.keysRight.push(68);  // D
    camera.checkCollisions = true;


    Promise.all([loadCylinders(), loadRoom(), /* loadClipboard(scene) */]).then(async ([cylinders, { root, table, walls, cabinet, floor }]) => {
        camera.ellipsoid = new Vector3(0.4, 0.9, 0.4);
        camera.attachControl(canvas, true);
        camera.applyGravity = true;

        // Enable collisions between meshes
        scene.registerBeforeRender(() => {
            const { leftCylinder, staticCylinder, rightCylinder } = cylinders;
            const leftCylinderMesh = leftCylinder.getChildMeshes().find(mesh => mesh.name === 'cylinder')!;
            const rightCylinderMesh = rightCylinder.getChildMeshes().find(mesh => mesh.name === 'cylinder')!;

            if (leftCylinderMesh.intersectsMesh(table)) {
                const leftCylinderBoundingBox = leftCylinderMesh.getBoundingInfo().boundingBox;
                const tableBoundingBox = table.getBoundingInfo().boundingBox;
                
                const offset = calculateNearestOffset(tableBoundingBox, leftCylinderBoundingBox);
                
                leftCylinder.position.addInPlace(offset);
            }

            if (rightCylinderMesh.intersectsMesh(table)) {
                const rightCylinderBoundingBox = rightCylinderMesh.getBoundingInfo().boundingBox;
                const tableBoundingBox = table.getBoundingInfo().boundingBox;
                
                const offset = calculateNearestOffset(tableBoundingBox, rightCylinderBoundingBox);
                
                rightCylinder.position.addInPlace(offset);
            }

            if (leftCylinderMesh.intersectsMesh(rightCylinderMesh)) {
                const leftCylinderBoundingBox = leftCylinderMesh.getBoundingInfo().boundingBox;
                const rightCylinderBoundingBox = rightCylinderMesh.getBoundingInfo().boundingBox;

                let collidingMesh = rightCylinder;
                let collidingMeshBoundingBox = rightCylinderBoundingBox;
                let collidedMeshBoundingBox = leftCylinderBoundingBox;
                if ((leftCylinder.behaviors.find(behavior => behavior.name === 'PointerDrag') as PointerDragBehavior | undefined)?.dragging) {
                    collidingMesh = leftCylinder;
                    collidingMeshBoundingBox = leftCylinderBoundingBox;
                    collidedMeshBoundingBox = rightCylinderBoundingBox;
                }
                
                const offset = calculateNearestOffset(collidedMeshBoundingBox, collidingMeshBoundingBox);

                collidingMesh.position.addInPlace(offset);
            }
        });

        const xrOptions = {
            floorMeshes: [floor],
            ignoreNativeCameraTransformation: true
        };
        const xr = await scene.createDefaultXRExperienceAsync(xrOptions);
        enableXRGrab(xr.input);
        const featureManager = xr.baseExperience.featuresManager;
        
        const { leftCylinder, rightCylinder, staticCylinder } = cylinders;
        const staticCylinderBoundingBox = staticCylinder.getChildMeshes().find(mesh => mesh.name === 'cylinder')!.getBoundingInfo().boundingBox;
        const r = (staticCylinderBoundingBox.maximum.y + staticCylinderBoundingBox.minimum.y) / 2;
        leftCylinder.addBehavior(new PouringBehavior(staticCylinder, r, xr.baseExperience));
        rightCylinder.addBehavior(new PouringBehavior(staticCylinder, r, xr.baseExperience));
        // featureManager.enableFeature(WebXRFeatureName.HAND_TRACKING, 'latest', {
        //     xrInput: xr.input,
        // });

        // TODO: create an option for teleportation/no teleportation
        // featureManager.disableFeature(WebXRFeatureName.TELEPORTATION);
        // featureManager.enableFeature(WebXRFeatureName.MOVEMENT, 'latest', {
        //     xrInput: xr.input,
        //     movementSpeed: 0.07,  // These configuration options seem to be good
        //     rotationSpeed: 0.3
        // });

        // const wallsBoundingBox = walls.getBoundingInfo().boundingBox;  // TODO: does this become out of date after changes to the room's position?
        // ground = CreateGround('ground', { width: wallsBoundingBox.maximum.x - wallsBoundingBox.minimum.x, height: wallsBoundingBox.maximum.z - wallsBoundingBox.minimum.z });
        // ground.position.y = wallsBoundingBox.minimumWorld.y - 0.01;
        // ground.isVisible = false;
        // ground.checkCollisions = true;

        // Place the cylinders on the table
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        const tableMinimum = tableBoundingBox.minimum;
        const tableMaximum = tableBoundingBox.maximum;
        const staticCylinderX = tableBoundingBox.center.x;
        // const leftCylinderX = (tableMinimum.x + staticCylinderX) / 2;
        // const rightCylinderX = (staticCylinderX + tableMaximum.x) / 2;
        const leftCylinderX = staticCylinderX - 0.5;
        const rightCylinderX = staticCylinderX + 0.5;
        const cylinderOpacity = staticCylinder.getChildMeshes().find(mesh => mesh.name === 'cylinder')!;
        const cylinderVerticalOffset = cylinderOpacity.position.y - cylinderOpacity.getBoundingInfo().boundingBox.minimum.y;
        const cylinderY = tableMaximum.y + cylinderVerticalOffset;
        const cylinderZ = (tableBoundingBox.center.z + tableMinimum.z) / 2;
        leftCylinder.position = new Vector3(leftCylinderX, cylinderY, cylinderZ);
        staticCylinder.position = new Vector3(staticCylinderX, cylinderY, cylinderZ);
        rightCylinder.position = new Vector3(rightCylinderX, cylinderY, cylinderZ);
        
        const failSound = new Sound('explosion', `${rootPath}sound/mi_explosion_03_hpx.mp3`, scene);
        const failCallback = () => {
            light.setEnabled(false);
        }
        sop.failSound = failSound;
        sop.addFailEffects(failSound, failCallback);

        const successSound = new Sound('ding', `${rootPath}sound/ding-idea-40142.mp3`, scene);
        const successCallback = () => {};
        sop.addSuccessEffects(successSound, successCallback);
    });

    // const gui3dManager = new GUI3DManager(scene);

    // // const debugMenu = new HandMenu(xr.baseExperience, 'debug-menu');
    // const debugMenu = new StackPanel3D();
    // gui3dManager.addControl(debugMenu);
    // const debugButton = new TouchHolographicButton('debug-button');
    // debugMenu.addControl(debugButton);
    // debugMenu.position.y = 1.5;
    // debugMenu.position.z = camera.position.z + 3;
    // scene.registerBeforeRender(() => debugButton.text = `height: ${xr.baseExperience.camera.realWorldHeight}`);

    // // debugMenu.isPinned = true;
    // // debugMenu.isVisible = true;
    // // debugMenu.scaling = Vector3.One().scaleInPlace(1);
    // xr.baseExperience.onStateChangedObservable.add(state => {
    //     switch (state) {
    //         case WebXRState.IN_XR:
    //             xr.baseExperience.camera.position = new Vector3(camera.position.x, camera.position.y + 1.3, camera.position.z);
    //             // printOnHand(debugMenu, `height: ${xr.baseExperience.camera.realWorldHeight}`);  // 1 unit is ~41 inches
    //             break;
    //     }
    // });
    return scene;
};

import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Nullable } from '@babylonjs/core/types';
import { Engine } from '@babylonjs/core/Engines/engine';
import { WebXRState, WebXRExperienceHelper } from '@babylonjs/core/XR';
import { WebXRFeatureName } from '@babylonjs/core/XR';
import { Sound } from '@babylonjs/core/Audio/sound';

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
import '@babylonjs/core/Rendering/boundingBoxRenderer';  // To render bounding boxes
import '@babylonjs/core/Collisions/collisionCoordinator';  // To enable collisions
import '@babylonjs/core/Audio/audioSceneComponent';

import { loadCylinders } from './loadCylinders';
import { loadClipboard} from './loadClipboard';
import { loadModels} from './loadModels';
import { loadRoom } from './loadRoom';
import enableXRGrab from './enableXRGrab';
import PouringBehavior from './PouringBehavior';
import { debug, performanceMonitor, resetGlobals, sop } from './globals';
import { CYLINDER_MESH_NAME, FAIL_SOUND_PATH, SUCCESS_SOUND_PATH, RENDER_CANVAS_ID } from './constants';
import { calculateNearestOffset, getChildMeshByName } from './utils';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import HighlightBehavior from './HighlightBehavior';
import { Color3 } from '@babylonjs/core';
import { loadPlacards } from './loadPlacards';


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
    if (debug) {
        scene.debugLayer.show();
    }
    scene.gravity = new Vector3(0, -9.80665, 0);
    scene.collisionsEnabled = true;

    const lights = [new HemisphericLight('light', new Vector3(0, 1, 0), scene), new PointLight('point-light', new Vector3(0, 1, -1.1), scene)];
    
    const camera = new UniversalCamera('camera', new Vector3(0, 1.8, -2), scene);
    camera.minZ = 0;  // To prevent clipping through near meshes
    camera.speed = 0.2;
    camera.keysUp.push(87);  // W
    camera.keysDown.push(83);  // S
    camera.keysLeft.push(65);  // A
    camera.keysRight.push(68);  // D
    camera.checkCollisions = true;

    scene.onBeforeRenderObservable.add(() => performanceMonitor.sampleFrame());

    Promise.all([loadCylinders(), loadRoom(), loadPlacards()]).then(async ([cylinders, { root, table, walls, cabinet, floor }, [placardA, placardB, placardC]]) => {
        camera.ellipsoid = new Vector3(0.4, 0.9, 0.4);
        camera.attachControl(canvas, true);
        camera.applyGravity = true;
        // clipboard.position=new Vector3(0, -.5, 0);

        // Enable collisions between meshes
        interface CylinderPositionIndex {
            [index: string]: {
                initialPosition: Vector3
                offsetPosition: Vector3
                direction: string
            }
        }
        let cylinderPositionIndex: CylinderPositionIndex = {};
        const collisionOffsetObserver = scene.onBeforeRenderObservable.add((_, eventState) => {
            const { leftCylinder, staticCylinder, rightCylinder } = cylinders;
            const leftCylinderMesh = getChildMeshByName(leftCylinder, CYLINDER_MESH_NAME)!;
            const rightCylinderMesh = getChildMeshByName(rightCylinder, CYLINDER_MESH_NAME)!;
            const staticCylinderMesh = getChildMeshByName(staticCylinder, CYLINDER_MESH_NAME)!;

            // TODO: walls are tricky because the bounding box spans the whole room. Maybe each wall should be its own submesh to solve this?
            const collidableMeshes = [table, cabinet, floor, leftCylinderMesh, rightCylinderMesh, staticCylinderMesh, placardA, placardB, placardC];

            Object.values(cylinders).forEach(cylinder => {
                const cylinderMesh = getChildMeshByName(cylinder, CYLINDER_MESH_NAME)!;
                collidableMeshes.forEach(collidedMesh => {
                    if (cylinderMesh !== collidedMesh && cylinderMesh.intersectsMesh(collidedMesh, true)) {
                        const cylinderMeshBoundingBox = cylinderMesh.getBoundingInfo().boundingBox;
                        const collidedMeshBoundingBox = collidedMesh.getBoundingInfo().boundingBox;
                        const offset = calculateNearestOffset(collidedMeshBoundingBox, cylinderMeshBoundingBox);
                        cylinderPositionIndex[cylinder.name] = {
                            initialPosition: cylinder.position.clone(),
                            offsetPosition: cylinder.position.add(offset),
                            direction: offset.x ? 'x' : offset.y ? 'y' : 'z'
                        };
                    }
                });
            });
        });
        
        const collisionOverrideObserver = scene.onBeforeRenderObservable.add(() => {
            Object.values(cylinders).forEach(cylinder => {
                // TODO: fix the issue with colliding with multiple meshes simultaneously
                if (cylinderPositionIndex[cylinder.name]) {
                    const { initialPosition, offsetPosition, direction } = cylinderPositionIndex[cylinder.name];
                    switch (direction) {
                        case 'x':
                            if (offsetPosition.x - initialPosition.x > 0) {
                                if (cylinder.position.x < offsetPosition.x) {
                                    cylinder.position.x = offsetPosition.x;
                                }
                            } else {
                                if (cylinder.position.x > offsetPosition.x) {
                                    cylinder.position.x = offsetPosition.x;
                                }
                            }
                            break;
                        case 'y':
                            if (offsetPosition.y - initialPosition.y > 0) {
                                if (cylinder.position.y < offsetPosition.y) {
                                    cylinder.position.y = offsetPosition.y;
                                }
                            } else {
                                if (cylinder.position.y > offsetPosition.y) {
                                    cylinder.position.y = offsetPosition.y;
                                }
                            }
                            break;
                        case 'z':
                            if (offsetPosition.z - initialPosition.z > 0) {
                                if (cylinder.position.z < offsetPosition.z) {
                                    cylinder.position.z = offsetPosition.z;
                                }
                            } else {
                                if (cylinder.position.z > offsetPosition.z) {
                                    cylinder.position.z = offsetPosition.z;
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
            });
            cylinderPositionIndex = {};
        });

        scene.onBeforeRenderObservable.makeObserverTopPriority(collisionOffsetObserver!);
        scene.onBeforeRenderObservable.makeObserverBottomPriority(collisionOverrideObserver!);


        const xrOptions = {
            floorMeshes: [floor],
            ignoreNativeCameraTransformation: true
        };
        const xr = await scene.createDefaultXRExperienceAsync(xrOptions);
        enableXRGrab(xr.input);
        const featureManager = xr.baseExperience.featuresManager;
        
        const { leftCylinder, rightCylinder, staticCylinder } = cylinders;
        const staticCylinderBoundingBox = getChildMeshByName(staticCylinder, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox;
        const r = (staticCylinderBoundingBox.maximum.y + staticCylinderBoundingBox.minimum.y) / 2;
        leftCylinder.addBehavior(new PouringBehavior(r, xr.baseExperience));
        rightCylinder.addBehavior(new PouringBehavior(r, xr.baseExperience));
        staticCylinder.addBehavior(new PouringBehavior(r, xr.baseExperience));

        Object.values(cylinders).forEach(cylinder => {
            const highlightLayer = new HighlightLayer('highlight-layer');
            highlightLayer.innerGlow = true;
            highlightLayer.outerGlow = false;
            highlightLayer.isEnabled = false;
            getChildMeshByName(cylinder, CYLINDER_MESH_NAME)!.addBehavior(new HighlightBehavior(highlightLayer, Color3.Green()));
        });

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
        const cylinderOpacity = getChildMeshByName(staticCylinder, CYLINDER_MESH_NAME)!;
        const cylinderOpacityBoundingBox = cylinderOpacity.getBoundingInfo().boundingBox;
        const cylinderVerticalOffset = cylinderOpacity.position.y - cylinderOpacityBoundingBox.minimum.y;
        const cylinderY = tableMaximum.y + cylinderVerticalOffset;
        const cylinderZ = (tableBoundingBox.center.z + tableMinimum.z) / 2;
        leftCylinder.position = new Vector3(leftCylinderX, cylinderY, cylinderZ);
        staticCylinder.position = new Vector3(staticCylinderX, cylinderY, cylinderZ);
        rightCylinder.position = new Vector3(rightCylinderX, cylinderY, cylinderZ);

        const cylinderWidth = cylinderOpacityBoundingBox.maximumWorld.x - cylinderOpacityBoundingBox.minimumWorld.x;
        placardA.position = new Vector3(leftCylinderX + cylinderWidth, tableMaximum.y, cylinderZ + 0.15);
        placardB.position = new Vector3(staticCylinderX + cylinderWidth, tableMaximum.y, cylinderZ + 0.15);
        placardC.position = new Vector3(rightCylinderX + cylinderWidth, tableMaximum.y, cylinderZ + 0.15);
        
        const failSound = new Sound('explosion', FAIL_SOUND_PATH, scene);
        const failCallback = () => {
            lights.forEach(light => light.setEnabled(false));
            // TODO: I don't like this solution to prevent the cylinders from remaining highlighted. Ideally, we would have a permanent, catch-all solution
            Object.values(cylinders).forEach(cylinder => {
                const highlightBehavior = getChildMeshByName(cylinder, CYLINDER_MESH_NAME)!.getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
                if (highlightBehavior) {
                    highlightBehavior.detach();
                }
            });
        };
        sop.failSound = failSound;
        sop.addFailEffects(failSound, failCallback);

        const successSound = new Sound('ding', SUCCESS_SOUND_PATH, scene);
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

export function resetLastCreatedScene() {
    const scene = Engine.LastCreatedScene;
    if (scene) {
        const engine = scene.getEngine();
        const canvas = document.getElementById(RENDER_CANVAS_ID) as HTMLCanvasElement;
        engine.stopRenderLoop();  // TODO: stop with the specific render function for the scene
        scene.dispose();
        resetGlobals();
        createScene(engine, canvas).then(scene => engine.runRenderLoop(function() { scene.render(); }));
    }
}

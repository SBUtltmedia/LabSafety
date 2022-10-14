import { Scene } from '@babylonjs/core/scene';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Nullable } from '@babylonjs/core/types';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Sound } from '@babylonjs/core/Audio/sound';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { WebXRState } from '@babylonjs/core/XR';

import '@babylonjs/loaders/glTF';  // To enable loading .glb meshes
import '@babylonjs/core/Helpers/sceneHelpers';  // To enable creating the default XR experience
import '@babylonjs/core/Rendering/boundingBoxRenderer';  // To render bounding boxes
import '@babylonjs/core/Collisions/collisionCoordinator';  // To enable collisions
import '@babylonjs/core/Audio/audioSceneComponent';

import { loadCylinders } from './loadCylinders';
import { loadClipboard } from './loadClipboard';
import { loadRoom } from './loadRoom';
import enableXRGrab from './enableXRGrab';
import PouringBehavior from './PouringBehavior';
import { setAdvancedTexture, debug, resetGlobals, sop, bToCTask, cToATask, collidableMeshes, collidingMeshes } from './globals';
import { CYLINDER_MESH_NAME, FAIL_SOUND_PATH, SUCCESS_SOUND_PATH, RENDER_CANVAS_ID, TIME_UNTIL_FADE, CYLINDER_C_NAME, CYLINDER_A_NAME, COMPLETION_SOUND_PATH, COMPLETION_RESET_DELAY, FAILURE_RESET_DELAY } from './constants';
import { calculateNearestOffset, getChildMeshByName } from './utils';
import HighlightBehavior from './HighlightBehavior';
import { loadPlacards } from './loadPlacards';
import FlyToCameraBehavior from './FlyToCameraBehavior';
import { displayFailScreen } from './failScreen';
import RespawnBehavior from './RespawnBehavior';
import{MeshBuilder} from  '@babylonjs/core/Meshes';

export const createScene = async (engine: Engine, canvas: HTMLCanvasElement) => {
    const scene = new Scene(engine);
    setAdvancedTexture(AdvancedDynamicTexture.CreateFullscreenUI('ui'));
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

    Promise.all([loadCylinders(), loadRoom(), loadPlacards(), loadClipboard()]).then(async ([cylinders, { root, table, walls, cabinet, floor }, [placardA, placardB, placardC], clipboard]) => {
        camera.ellipsoid = new Vector3(0.4, 0.9, 0.4);
        camera.attachControl(canvas, true);
        const sphere =MeshBuilder.CreateSphere("sphere",{}, scene);
        sphere.parent=camera;
        sphere.position.z= 1;
        camera.applyGravity = true;

        // Enable collisions between meshes
        collidingMeshes.push(...Object.values(cylinders));
        interface CylinderPositionIndex {
            [index: string]: {
                initialPosition: Vector3
                offsetPosition: Vector3
                direction: string
            }
        }
        let cylinderPositionIndex: CylinderPositionIndex = {};
        const collisionOffsetObserver = scene.onBeforeRenderObservable.add((_, eventState) => {
            const { cylinderA, cylinderB, cylinderC } = cylinders;
            const cylinderAMesh = getChildMeshByName(cylinderA, CYLINDER_MESH_NAME)!;
            const cylinderCMesh = getChildMeshByName(cylinderC, CYLINDER_MESH_NAME)!;
            const cylinderBMesh = getChildMeshByName(cylinderB, CYLINDER_MESH_NAME)!;

            // TODO: walls are tricky because the bounding box spans the whole room. Maybe each wall should be its own submesh to solve this?
            collidableMeshes.push(table, cabinet, floor, cylinderAMesh, cylinderCMesh, cylinderBMesh, placardA, placardB, placardC);

            collidingMeshes.forEach(cylinder => {
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
            collidingMeshes.forEach(cylinder => {
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

        const { cylinderA, cylinderC, cylinderB } = cylinders;
        const cylinderBBoundingBox = getChildMeshByName(cylinderB, CYLINDER_MESH_NAME)!.getBoundingInfo().boundingBox;
        const r = (cylinderBBoundingBox.maximum.y + cylinderBBoundingBox.minimum.y) / 2;
        cylinderA.addBehavior(new PouringBehavior(r, xr.baseExperience, (target) => {
            const currentTask = sop.getCurrentTask();
            if (currentTask && !currentTask.complete) {
                sop.failCurrentTask();
            }
        }, (target) => {

        }));
        cylinderC.addBehavior(new PouringBehavior(r, xr.baseExperience, (target) => {
            const currentTask = sop.getCurrentTask();
            if (currentTask && !currentTask.complete) {
                if (currentTask === cToATask) {
                    if (target.name !== CYLINDER_A_NAME) {
                        sop.failCurrentTask();
                    }
                } else {
                    sop.failCurrentTask();
                }
            }
        }, (target) => {
            const currentTask = sop.getCurrentTask();
            if (currentTask) {
                if (currentTask === cToATask) {
                    if (target.name === CYLINDER_A_NAME) {
                        sop.completeCurrentTask();
                    } else {
                        sop.failCurrentTask();
                    }
                } else {
                    sop.failCurrentTask();
                }
            }
        }));
        cylinderB.addBehavior(new PouringBehavior(r, xr.baseExperience, (target) => {
            const currentTask = sop.getCurrentTask();
            if (currentTask && !currentTask.complete) {
                if (currentTask === bToCTask) {
                    if (target.name !== CYLINDER_C_NAME) {
                        sop.failCurrentTask();
                    }
                } else {
                    sop.failCurrentTask();
                }
            }
        }, (target) => {
            const currentTask = sop.getCurrentTask();
            if (currentTask) {
                if (currentTask === bToCTask) {
                    if (target.name === CYLINDER_C_NAME) {
                        sop.completeCurrentTask();
                    } else {
                        sop.failCurrentTask();
                    }
                } else {
                    sop.failCurrentTask();
                }
            }
        }));

        Object.values(cylinders).forEach(cylinder => {
            const highlightLayer = new HighlightLayer('highlight-layer');
            highlightLayer.innerGlow = true;
            highlightLayer.outerGlow = false;
            highlightLayer.isEnabled = false;
            getChildMeshByName(cylinder, CYLINDER_MESH_NAME)!.addBehavior(new HighlightBehavior(highlightLayer, Color3.Green()));
        });

        // Place the cylinders on the table
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        const tableMinimum = tableBoundingBox.minimum;
        const tableMaximum = tableBoundingBox.maximum;
        const cylinderBX = tableBoundingBox.center.x;
        const cylinderAX = cylinderBX - 0.5;
        const cylinderCX = cylinderBX + 0.5;
        const cylinderOpacity = getChildMeshByName(cylinderB, CYLINDER_MESH_NAME)!;
        const cylinderOpacityBoundingBox = cylinderOpacity.getBoundingInfo().boundingBox;
        const cylinderVerticalOffset = cylinderOpacity.position.y - cylinderOpacityBoundingBox.minimum.y + 0.00001;  // Tiny offset to prevent collision due to rounding error
        const cylinderY = tableMaximum.y + cylinderVerticalOffset;
        const cylinderZ = (tableBoundingBox.center.z + tableMinimum.z) / 2;
        cylinderA.position = new Vector3(cylinderAX, cylinderY, cylinderZ);
        cylinderB.position = new Vector3(cylinderBX, cylinderY, cylinderZ);
        cylinderC.position = new Vector3(cylinderCX, cylinderY, cylinderZ);

        // Add fade-in/fade-out respawn behavior using calculated positions as respawn points
        Object.values(cylinders).forEach(cylinder => {
            const respawnBehavior = new RespawnBehavior(cylinder.absolutePosition.clone(), TIME_UNTIL_FADE, getChildMeshByName(cylinder, CYLINDER_MESH_NAME)!);
            cylinder.addBehavior(respawnBehavior);
        });

        const cylinderWidth = cylinderOpacityBoundingBox.maximumWorld.x - cylinderOpacityBoundingBox.minimumWorld.x;
        placardA.position = new Vector3(cylinderAX + cylinderWidth, tableMaximum.y, cylinderZ + 0.15);
        placardB.position = new Vector3(cylinderBX + cylinderWidth, tableMaximum.y, cylinderZ + 0.15);
        placardC.position = new Vector3(cylinderCX + cylinderWidth, tableMaximum.y, cylinderZ + 0.15);

        clipboard.position = new Vector3(cylinderAX - 0.5, tableMaximum.y, cylinderZ);
        clipboard.rotationQuaternion = null;
        clipboard.rotation = new Vector3(0, Math.PI / 4, 0);
        clipboard.addBehavior(new FlyToCameraBehavior());

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
            if (xr.baseExperience.state === WebXRState.IN_XR) {
                setTimeout(resetLastCreatedScene, FAILURE_RESET_DELAY);
            } else {
                displayFailScreen(scene);
            }
        };
        sop.failSound = failSound;
        sop.addFailEffects(failSound, failCallback);

        const successSound = new Sound('ding', SUCCESS_SOUND_PATH, scene);
        const successCallback = () => { };
        sop.addSuccessEffects(successSound, successCallback);

        const completionSound = new Sound('fanfare', COMPLETION_SOUND_PATH, scene);
        const completionCallback = () => setTimeout(resetLastCreatedScene, COMPLETION_RESET_DELAY);
        sop.addCompletionEffects(completionSound, completionCallback);
    });

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
        createScene(engine, canvas).then(scene => engine.runRenderLoop(function () { scene.render(); }));
    }
}

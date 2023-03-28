import { CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME } from "./Constants";
import HighlightBehavior from "./HighlightBehavior";
import { getChildMeshByName, resetRotation } from "./utils";
import SOP from './SOP';
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Animation } from '@babylonjs/core/Animations/animation';
import { Nullable } from "@babylonjs/core/types";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color4, Vector3 } from "@babylonjs/core/Maths/math";
import { StandardMaterial } from "@babylonjs/core";



export function postSceneCylinder(scene: Scene, sop: SOP) {
    scene.onBeforeRenderObservable.add(function () {
        let cylinderLetters = ['A', 'B', 'C'];
        for (let i = 0; i < cylinderLetters.length; i++) {
            const cylinder = scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);
            const table: AbstractMesh = scene.getMeshByName('Table')!;
            if (table && cylinder) {
                const tableBoundingBox = table.getBoundingInfo().boundingBox;
                cylinder.position.z = (tableBoundingBox.centerWorld.z + tableBoundingBox.minimumWorld.z) / 2;
            }
        }
    });
    let cylinderLetters: Array<string> = ['A', 'B', 'C'];
    let allCylinders = [];
    for (let char of cylinderLetters) {
        const cylinder = scene.getMeshByName(`pivot-Cylinder-${char}`);
        allCylinders.push((cylinder as Mesh));
        let rotationAnimation = new Animation(`${char}-rotateAroundZ`, 'rotation.z', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        let sourceCylinder = getChildMeshByName(cylinder, CYLINDER_MESH_NAME);
        const keyFrames = [];
        keyFrames.push({
            frame: 0,
            value: Math.PI * 2
        });
        keyFrames.push({
            frame: 60,
            value: 4.62
        });
        sourceCylinder.animations.push(rotationAnimation);
        rotationAnimation.setKeys(keyFrames);

        let resetRotationAnimation = new Animation(`${char}-resetRotateAroundZ`, 'rotation.z', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const resetFrames = [];
        resetFrames.push({
            frame: 0,
            value: 4.62
        });
        resetFrames.push({
            frame: 60,
            value: Math.PI * 2
        });
        sourceCylinder.animations.push(resetRotationAnimation);
        resetRotationAnimation.setKeys(resetFrames);
    }
    let failBeaker: boolean = false
    for (let i = 0; i < cylinderLetters.length; i++) {
        const cylinder = scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);
        const gotSomething = cylinder.getBehaviorByName('PointerDrag');
        let filteredMeshes = [];
        for (let cylMesh of allCylinders) {
            if (cylMesh != cylinder) {
                filteredMeshes.push(cylMesh);
            }
        }

        //TODO: FIX THIS PROBLEM! IT DETECTS TOO EARLY
        let sourceCylinder = getChildMeshByName(cylinder, CYLINDER_MESH_NAME);
        let rotationFlag = false;
        (gotSomething as PointerDragBehavior).onDragObservable.add(() => {
            const highlightingTheDrag = getChildMeshByName(cylinder, CYLINDER_MESH_NAME).getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
            let hitDetected = false;
            for (let j = 0; j < cylinderLetters.length; j++) {
                if (i == j) continue;
                const cylinderHitDetected = scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[j]}`);

                resetRotation(cylinder);
                resetRotation(cylinderHitDetected);

                if (cylinder.intersectsMesh(cylinderHitDetected)) {
                    hitDetected = true;
                    let to = cylinderHitDetected.name.split('-')[2];
                    let from = cylinder.name.split('-')[2];
                    let fromAndTo = `${from}to${to}`
                    if (sop.tasks[sop.currentState].label === fromAndTo) {
                        console.log("WHAT??");
                        if (sop.tasks[sop.currentState].next === 'complete') {
                            window.location.assign('.');
                        } else {
                            sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
                        }
                    } else {
                        if (!failBeaker) {
                            failBeaker = true;
                            const particleSystem = new ParticleSystem("particles", 500, scene);
                            particleSystem.particleTexture = new Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png", scene);
                            particleSystem.minLifeTime = 0.5;
                            particleSystem.maxLifeTime = 0.7;
                            particleSystem.emitRate = 100;
                            particleSystem.gravity = new Vector3(0, .5, 0);
                            particleSystem.minSize = 0.01;
                            particleSystem.maxSize = 0.07;
                            particleSystem.createPointEmitter(new Vector3(0, 0, 0), new Vector3(0, 1, 0));
                            const cylinderLiquid: AbstractMesh = getChildMeshByName(cylinderHitDetected as AbstractMesh, CYLINDER_LIQUID_MESH_NAME)!;
                            particleSystem.addColorGradient(1, Color4.FromColor3((cylinderLiquid.material as StandardMaterial).diffuseColor, 1));
                            particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
                            particleSystem.emitter = cylinderHitDetected.position;
                            particleSystem.start();
                        }
                    }
                    if (highlightingTheDrag) {
                        let hitCylinder = getChildMeshByName(cylinderHitDetected, CYLINDER_MESH_NAME);

                        highlightingTheDrag.highlightMesh((sourceCylinder as Mesh));
                        highlightingTheDrag.highlightMesh((hitCylinder as Mesh));

                        let current_x = cylinder.getAbsolutePosition()._x;
                        let target_x = cylinderHitDetected.getAbsolutePosition()._x;

                        if (target_x < current_x) { // left hit
                            sourceCylinder.rotation.y = Math.PI;
                            cylinderHitDetected.rotation.y = sourceCylinder.rotation.y;
                        } else {
                            sourceCylinder.rotation.y = 0;
                            cylinderHitDetected.rotation.y = sourceCylinder.rotation.y;
                        }
                        if (!rotationFlag) {
                            let sizes = cylinder.getHierarchyBoundingVectors();
                            let ySize = sizes.max.y - sizes.min.y;
                            let offset = -0.09;
                            let xPos = target_x;
                            let deltaX = current_x - xPos;

                            if (target_x < current_x) {
                                console.log("Src pos: ", sourceCylinder.position.x);
                                sourceCylinder.position.x = deltaX + offset;
                                sourceCylinder.position.y = ySize - 0.2;
                            } else {
                                sourceCylinder.position.x = deltaX - offset;
                                sourceCylinder.position.y = ySize - 0.2;
                            }

                            console.log("Y size: ", ySize);

                            let individualAnimation = sourceCylinder.getAnimationByName(`${cylinderLetters[i]}-rotateAroundZ`);
                            rotationFlag = true;
                            scene.beginDirectAnimation(sourceCylinder, [individualAnimation], 0, 60, false, undefined, () => {
                            });
                        }
                    }
                    break;
                } else {
                    highlightingTheDrag.unhighlightMesh((getChildMeshByName(cylinderHitDetected, CYLINDER_MESH_NAME) as Mesh));
                    resetRotation(cylinderHitDetected);
                    resetRotation(cylinder);
                }
            }
            if (hitDetected == false) {
                highlightingTheDrag.unhighlightMesh((sourceCylinder as Mesh));

                let individualAnimation = sourceCylinder.getAnimationByName(`${cylinderLetters[i]}-resetRotateAroundZ`);
                if (rotationFlag) {
                    sourceCylinder.position.x = 0;
                    sourceCylinder.position.y = 0;
                    rotationFlag = false;
                    console.log(sourceCylinder, individualAnimation, `${cylinderLetters[i]}-resetRotateAroundZ`)
                    scene.beginDirectAnimation(sourceCylinder, [individualAnimation], 0, 60, false, undefined, () => {
                    });                    
                }
            }
        });
        (gotSomething as PointerDragBehavior).onDragEndObservable.add(() => {
            const highlightingTheDrag = getChildMeshByName(cylinder, CYLINDER_MESH_NAME).getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
            for (let singleMesh of filteredMeshes) {
                if (singleMesh == sourceCylinder) continue;

                let targetCylinder = getChildMeshByName(singleMesh, CYLINDER_MESH_NAME);

                highlightingTheDrag.unhighlightMesh((sourceCylinder as Mesh));
                highlightingTheDrag.unhighlightMesh((targetCylinder as Mesh));

                if (sourceCylinder.intersectsMesh(singleMesh)) {
                    let individualAnimation = sourceCylinder.getAnimationByName(`${cylinderLetters[i]}-resetRotateAroundZ`);
                    if (sourceCylinder.rotation.z == 4.62) {
                        scene.beginDirectAnimation(sourceCylinder, [individualAnimation], 0, 60, false, undefined, () => { });
                    }
                }
            }
        })
    }
}
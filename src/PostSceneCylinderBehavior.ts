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
import { Color3, Color4, Vector3 } from "@babylonjs/core/Maths/math";
import { Engine, StandardMaterial } from "@babylonjs/core";
import { Interact } from "./Interact";
import { Cylinder } from "./Cylinder";
import { sop } from "./Constants";
import { GUIManager } from "./GUIManager";
import { SoundManager } from "./SoundManager";

export class SceneManager extends Interact {

    particleSystem: ParticleSystem;

    constructor(scene: Scene, cylinderInstances: Array<Cylinder>, guiManager: GUIManager, soundManager: SoundManager) {
        super(scene, cylinderInstances, guiManager, soundManager);
    }

    resetCylinders() {
        if (this.particleSystem) {
            this.particleSystem.stop();
        }
        let cylinderLetters = ['A', 'B', 'C'];
        for (let i = 0; i < cylinderLetters.length; i++) {
            const cylinder = this.scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);
            const table: AbstractMesh = this.scene.getMeshByName('Table')!;
            if (table && cylinder) {
                const tableBoundingBox = table.getBoundingInfo().boundingBox;
                cylinder.position.z = (tableBoundingBox.centerWorld.z + tableBoundingBox.minimumWorld.z) / 2;
            }
            super.getCylinderInstanceFromMesh(cylinder).setOpacity(0.85);
            super.getCylinderInstanceFromMesh(cylinder).setColor(super.getCylinderInstanceFromMesh(cylinder).originalColor);
            if (i == 0) {
                super.getCylinderInstanceFromMesh(cylinder).setColor(Color3.Red());
                super.getCylinderInstanceFromMesh(cylinder).currentColor = Color3.Red();
            }
        }

    }

    postSceneCylinder() {
        // this.scene.onBeforeRenderObservable.add(() => {this.resetCylinders()});
        // this.resetCylinders();
        let cylinderLetters: Array<string> = ['A', 'B', 'C'];
        let allCylinders = [];
        for (let char of cylinderLetters) {
            const cylinder = this.scene.getMeshByName(`pivot-Cylinder-${char}`);
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
        let samePour: boolean = false;
        for (let i = 0; i < cylinderLetters.length; i++) {
            
            const cylinder = this.scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);
            let cylinderInstance = super.getCylinderInstanceFromMesh(cylinder);

            const gotSomething = cylinder.getBehaviorByName('PointerDrag');

            console.log(gotSomething);

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
                Engine.audioEngine.unlock();
                Engine.audioEngine.audioContext.resume();
                let doneSOP = false;
                let hitDetected = false;
                resetRotation(cylinder);
                const cylinderHitDetected = super.intersectCylinder(cylinder);
                if (cylinderHitDetected) {
                    let cylinderHitInstance = super.getCylinderInstanceFromMesh(cylinderHitDetected)
                    hitDetected = true;
                    let to = cylinderHitDetected.name.split('-')[2];
                    let from = cylinder.name.split('-')[2];
                    let fromAndTo = `${from}to${to}`
                    if (sop.tasks[sop.currentState].label === fromAndTo) {
                        samePour = true;
                        if (sop.tasks[sop.currentState].next === 'complete') {
                            // for (let cylinderInstance of super.cylinderInstances) {
                            //     cylinderInstance.resetProperties();
                            // }   
                            doneSOP = true;
                            console.log(cylinderHitInstance);
                            // play the sound after the anumation is done
                            setTimeout(() => {super.playSuccess();}, 300);

                            cylinderInstance.fadeAndRespawn();
                            sop.resetSOP();
                            this.resetCylinders();
                            
                            
                        } else {
                            sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
                            super.playDing();
                        }
                    } else {
                        if (!failBeaker && !samePour) {
                            this.particleSystem = super.showEffects(cylinderHitDetected);
                            failBeaker = true;
                        }
                    }

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
                        rotationFlag = super.highlightAndRotateCylinders(cylinderInstance, cylinderHitInstance, rotationFlag);
                        let to = cylinderHitDetected.name.split('-')[2];
                        let from = cylinder.name.split('-')[2];
                        let fromAndTo = `${from}to${to}`;
                        if (!doneSOP)
                            super.addColors(cylinderInstance, cylinderHitInstance);
                        
                    }
                } else {
                    cylinderInstance.highlight(false);
                    resetRotation(cylinder);
                }

                if (hitDetected == false) {
                    cylinderInstance.highlight(false);
                    samePour = false;
                    if (rotationFlag) {
                        sourceCylinder.position.x = 0;
                        sourceCylinder.position.y = 0;
                        rotationFlag = false;
                        cylinderInstance.resetAroundZ();
                    }
                }
            });
            (gotSomething as PointerDragBehavior).onDragEndObservable.add(() => {
                const highlightingTheDrag = getChildMeshByName(cylinder, CYLINDER_MESH_NAME).getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
                for (let singleMesh of filteredMeshes) {
                    if (singleMesh == sourceCylinder) continue;

                    cylinderInstance.highlight(false);
                    super.getCylinderInstanceFromMesh(singleMesh).highlight(false);

                    if (sourceCylinder.intersectsMesh(singleMesh)) {
                        cylinderInstance.resetAroundZ();
                        sourceCylinder.position.x = 0;
                        sourceCylinder.position.y = 0;
                        rotationFlag = false;
                    }
                }
            })
        }
    }
}
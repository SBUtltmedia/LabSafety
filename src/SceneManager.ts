import { CYLINDER_MESH_NAME } from "./Constants";
// import HighlightBehavior from "./HandDragBehavior";
import { getChildMeshByName, resetRotation } from "./utils";
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Animation } from '@babylonjs/core/Animations/animation';
import { Nullable } from "@babylonjs/core/types";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { Engine, WebXRDefaultExperience } from "@babylonjs/core";
import { Interact } from "./Interact";
import { Cylinder } from "./Cylinder";
import { sop } from "./Constants";
import { GUIManager } from "./GUIManager";
import { SoundManager } from "./SoundManager";

export class SceneManager extends Interact {

    particleSystem: ParticleSystem;
    instances: Array<Cylinder>

    constructor(scene: Scene, cylinderInstances: Array<Cylinder>, guiManager: GUIManager, soundManager: SoundManager, xrCamera: WebXRDefaultExperience) {
        super(scene, cylinderInstances, guiManager, soundManager, xrCamera);
        this.instances = cylinderInstances;
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
            super.getCylinderInstanceFromMesh(cylinder).showEffects(false);
            super.getCylinderInstanceFromMesh(cylinder).resetProperties();
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
            let rotationAnimationLeft = new Animation(`${char}-rotateAroundZleft`, 'rotation.z', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            let sourceCylinder = getChildMeshByName(cylinder, CYLINDER_MESH_NAME);
            let keyFrames = [];
            keyFrames.push({
                frame: 0,
                value: 0
            });
            keyFrames.push({
                frame: 60,
                value: Math.PI/2
            });
            sourceCylinder.animations.push(rotationAnimationLeft);
            rotationAnimationLeft.setKeys(keyFrames);

            let rotationAnimationRight = new Animation(`${char}-rotateAroundZright`, 'rotation.z', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            keyFrames = [];
            keyFrames.push({
                frame: 0,
                value: 0
            });
            keyFrames.push({
                frame: 60,
                value: -Math.PI/2
            });
            sourceCylinder.animations.push(rotationAnimationRight);
            rotationAnimationRight.setKeys(keyFrames);            

            let resetRotationAnimationleft = new Animation(`${char}-resetRotateAroundZleft`, 'rotation.z', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            let resetFrames = [];
            resetFrames.push({
                frame: 0,
                value: Math.PI/2
            });
            resetFrames.push({
                frame: 60,
                value: 0
            });
            sourceCylinder.animations.push(resetRotationAnimationleft);
            resetRotationAnimationleft.setKeys(resetFrames);

            let resetRotationAnimationRight = new Animation(`${char}-resetRotateAroundZright`, 'rotation.z', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            resetFrames = [];
            resetFrames.push({
                frame: 0,
                value: -Math.PI/2
            });
            resetFrames.push({
                frame: 60,
                value: 0
            });
            sourceCylinder.animations.push(resetRotationAnimationRight);
            resetRotationAnimationRight.setKeys(resetFrames);            
        }

        let prevHit;

        for (let i = 0; i < cylinderLetters.length; i++) {

            const cylinder = this.scene.getMeshByName(`pivot-Cylinder-${cylinderLetters[i]}`);
            let cylinderInstance = super.getCylinderInstanceFromMesh(cylinder);

            const gotSomething = cylinder.getBehaviorByName('PointerDrag');



            let filteredMeshes = [];
            for (let cylMesh of allCylinders) {
                if (cylMesh != cylinder) {
                    filteredMeshes.push(cylMesh);
                }
            }

            let failBeaker: boolean = false
            let samePour: boolean = false;            

            //TODO: FIX THIS PROBLEM! IT DETECTS TOO EARLY
            let sourceCylinder = getChildMeshByName(cylinder, CYLINDER_MESH_NAME);
            let rotationFlag = false;
            let hit = "resetRotateAroundZleft";

            let rotateTimeout;

            if (cylinder.isPickable) {
                (gotSomething as PointerDragBehavior).onDragObservable.add(() => {

                    // Engine.audioEngine.unlock();
                    // Engine.audioEngine.audioContext.resume();

                    let doneSOP = false;
                    let hitDetected = false;
                    resetRotation(cylinder);
                    let cylinderHitInstance;
                    const cylinderHitDetected = super.intersectCylinder(cylinder);

                    if (cylinderHitDetected) {                        
                        cylinderHitInstance = super.getCylinderInstanceFromMesh(cylinderHitDetected)
                        prevHit = cylinderHitInstance;

                        super.highlightCylinders(cylinderInstance, cylinderHitInstance);

                        hitDetected = true;

                        let to = cylinderHitDetected.name.split('-')[2];
                        let from = cylinder.name.split('-')[2];
                        let fromAndTo = `${from}to${to}`

                        if (!rotationFlag) {
                            rotationFlag = true;
                            rotateTimeout = setTimeout(() => {
                                super.RotateCylinders(cylinderInstance, cylinderHitInstance);
                                let to = cylinderHitDetected.name.split('-')[2];
                                let from = cylinder.name.split('-')[2];
                                let fromAndTo = `${from}to${to}`;

                                if (sop.tasks[sop.currentState].label === fromAndTo) {
                                    samePour = true;
                                    if (sop.tasks[sop.currentState].next === 'complete') {
                                        // for (let cylinderInstance of super.cylinderInstances) {
                                        //     cylinderInstance.resetProperties();
                                       // }   
                                        doneSOP = true;

        
                                        setTimeout(() => {
                                            super.playSuccess();
                                        }, 500);
        
                                        // play the sound after the animation is done
                                        setTimeout(() => {
                                            cylinderInstance.fadeAndRespawn();
                                        }, 1500);
                                        
                                        sop.resetSOP();
                                        this.resetCylinders();
                                        super.showFinishScreen();
                                        
                                        
                                    } else {
                                        sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
                                        super.playDing();
                                    }
                                } else {

                                    if (!failBeaker && !samePour) {

                                        for (let cylinder of this.instances) {
                                            cylinder.mesh.isPickable = false;
                                            cylinder.moveFlag = false;
                                        }
        
                                        cylinderHitInstance.showEffects(true);
                                        setTimeout(() => {
                                        super.playExplosion();
                                        }, 800);
        
                                        setTimeout(()=>cylinderHitInstance.showEffects(false),1000)
                                        
                                        failBeaker = true;
                                    
                                        setTimeout(() => {
                                            (gotSomething as PointerDragBehavior).releaseDrag();
                                            super.showFailureScreen();
                                            sop.resetSOP();
                                            failBeaker = false;
                                        }, 1500);
                                    }
                                }

                                if (!doneSOP)
                                    super.addColors(cylinderInstance, cylinderHitInstance);
                                
                                if (cylinderHitDetected.position.x > cylinder.position.x) {
                                    hit = "resetRotateAroundZright";
                                }
                            }, 700);
                        }
                    }

                    if (hitDetected === false && cylinderInstance.rotateEnd) {
                        cylinderInstance.highlight(false);
                        if (prevHit) {

                            prevHit.highlight(false);
                            prevHit = undefined;
                            // prevHit = null;
                        }
                            
                        if (rotateTimeout) {
                            clearTimeout(rotateTimeout);
                            rotateTimeout = null;
                            samePour = false;
                            rotationFlag = false;
                        } else {
                            samePour = false;
                            if (rotationFlag) {

                                rotationFlag = false;
                                cylinderInstance.rotateAnimation(hit, null, true);
                            }
                        }
                    }
                });
            }
            (gotSomething as PointerDragBehavior).onDragEndObservable.add(() => {
                rotationFlag = false;

                for (let singleMesh of filteredMeshes) {
                    if (singleMesh === sourceCylinder) continue;

                    cylinderInstance.highlight(false);
                    super.getCylinderInstanceFromMesh(singleMesh).highlight(false);

                    if (sourceCylinder.intersectsMesh(singleMesh)) {
                        cylinderInstance.rotateAnimation(hit);
                        sourceCylinder.position.x = 0;
                        sourceCylinder.position.y = 0;
                    }
                }
            })
        }
    }
}
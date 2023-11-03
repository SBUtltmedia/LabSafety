import {
    Mesh,
    AbstractMesh,
    Scene,
    Animation,
    ParticleSystem,
    WebXRDefaultExperience,
    Vector3,
    WebXRState,
} from "@babylonjs/core";

import { MotionControllerWithGrab, sop } from "./Constants";
import { Cylinder } from "./Cylinder";
import { GUIManager } from "./GUIManager";
import { Interact } from "./Interact";
import { PostSceneCylinder } from "./PostSceneCylinder";
import { SoundManager } from "./SoundManager";
import { FireExtinguisher } from "./FireExtinguisher";
import { log } from "./utils";
import { Fire } from "./Fire";

export class Hand extends Interact {
    handedness: string;
    holdingInstance: Cylinder | null;
    holdingMesh: Mesh | AbstractMesh;
    targetMesh: false | AbstractMesh;
    targetMeshInstance: Cylinder | null;
    motionController: MotionControllerWithGrab | null;
    handMesh: Mesh | AbstractMesh;
    isVisible: boolean;
    failBeaker: boolean;
    particleSystem: ParticleSystem;
    cylinderInstancesHand: Cylinder[];

    constructor(
        handedness: string,
        scene: Scene,
        cylinderInstances: Array<Cylinder>,
        guiManager: GUIManager,
        soundManager: SoundManager,
        xrCamera: WebXRDefaultExperience,
        fireExtinguisher: FireExtinguisher
        
    ) {
        super(scene, cylinderInstances, guiManager, soundManager, xrCamera, fireExtinguisher);
        this.handedness = handedness;
        this.handMesh = scene.getMeshByName(this.handedness);
        this.isVisible = true;
        this.failBeaker = false;
    }

    getMotionController() {
        return this.motionController;
    }

    setMotionController(motionController: MotionControllerWithGrab) {
        this.motionController = motionController;
    }

    dropped(grabInterval = null, respawn = true) {
        if (
            Vector3.Distance(
                this.holdingInstance.mesh.position,
                this.holdingInstance.startPos
            ) == 0
        ) {
            respawn = false;
        }

        this.motionController.lastPosition = null;

        if (grabInterval) clearInterval(grabInterval);

        this.motionController.grabbed = false;
        this.motionController.meshGrabbed = undefined;

        if (this.holdingMesh) {
            if (respawn) {
                this.holdingInstance.fadeAndRespawn(
                    100,
                    null,
                    this.holdingMesh.isPickable
                );
            }
            this.holdingMesh = null;
            this.holdingInstance = null;
            this.motionController.meshGrabbed = null;
        }
    }

    updateSOPTask(from: string, to: string) {
        let fromAndTo = `${from}to${to}`;
        if (sop.tasks[sop.currentState].label === fromAndTo) {
            if (sop.tasks[sop.currentState].next === "complete") {
                let sceneManager = new PostSceneCylinder(
                    this.scene,
                    this.cylinderInstances,
                    this.guiManager,
                    this.soundManager,
                    this.xrCamera,
                    this.fireExtinguisher
                );
                for (let cylinder of this.cylinderInstances) {
                    cylinder.moveFlag = false;
                    cylinder.mesh.isPickable = false;
                }
                setTimeout(() => {
                    for (let cylinder of this.cylinderInstances) {
                        cylinder.fadeAndRespawn(100, null, false);
                    }
                    super.playSuccess();
                    // this.dropped(timeout, false);

                    this.disappearAnimation(false);

                    // this.dropped(timeout);

                    if (this.xrCamera.baseExperience.state == WebXRState.IN_XR) {
                        super.showFinishScreen();
                        let screen = this.scene.getMeshByName("Start");
                        if (screen) {
                            let camera = this.xrCamera.baseExperience.camera;
                            screen.parent = camera;
                            screen.position = camera.position.add(
                                new Vector3(-camera.position.x, -1.5, 1.15)
                            );

                            screen.position.x = 0;
                            screen.position.y = 0;
                            screen.position.z = 0.95;

                            this.xrCamera.pointerSelection.displayLaserPointer = true;
                            this.xrCamera.pointerSelection.displaySelectionMesh = true;

                            screen.rotation = Vector3.Zero();
                        }
                    }
                }, 1000);

                sop.resetSOP();

                if (this.particleSystem) {
                    this.particleSystem.stop();
                }

                for (let cylinderInstance of this.cylinderInstances) {
                    cylinderInstance.showEffects(false);
                }
                return true;
            } else {
                super.playDing();
                sop.currentState = sop.tasks.indexOf(
                    sop.tasks.find(
                        (value) => value.label == sop.tasks[sop.currentState].next
                    )
                );
                return undefined;
            }
        } else {
            sop.failed = true;
            if (!this.failBeaker) {
                let fire = new Fire(this.scene);
                this.fireExtinguisher.fire = fire;
                fire.show();
                setTimeout(() => {
                    if (this.xrCamera.baseExperience.state == WebXRState.IN_XR) {
                        let screen = this.scene.getMeshByName("Start");
                        if (screen) {
                            let camera = this.xrCamera.baseExperience.camera;
                            screen.parent = camera;
                            screen.position = camera.position.add(
                                new Vector3(-camera.position.x, -1.5, 1.15)
                            );

                            this.xrCamera.pointerSelection.displayLaserPointer = true;
                            this.xrCamera.pointerSelection.displaySelectionMesh = true;

                            screen.position.x = 0;
                            screen.position.y = 0;
                            screen.position.z = 0.95;

                            log(screen);

                            screen.rotation = Vector3.Zero();
                        }
                    }
                    super.playExplosion();
                    this.targetMeshInstance.showEffects(true);
                }, 1000);
                // sop.resetSOP();
            }
        }
        return undefined;
    }

    disappearAnimation(disappear = true) {
        let endFrame = 60;
        let animations = [
            { name: "Invisibility", startValue: 1 },
            { name: "Visibility", startValue: 0 },
        ];
        animations.forEach((animation) => {
            animation["init"] = new Animation(
                animation.name,
                `visibility`,
                120,
                Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            animation["init"].setKeys([
                { frame: 0, value: animation.startValue },
                { frame: endFrame, value: 1 - animation.startValue },
            ]);
        });

        if (disappear) {
            this.isVisible = false;
            // this.handMesh.visibility = 0.5;
            this.scene.beginDirectAnimation(
                this.handMesh,
                [animations[0]["init"]],
                0,
                60,
                false
            );
        } else {
            this.isVisible = true;
            // this.handMesh.visibility = 1;
            this.scene.beginDirectAnimation(
                this.handMesh,
                [animations[1]["init"]],
                0,
                60,
                false
            );
        }
    }
}

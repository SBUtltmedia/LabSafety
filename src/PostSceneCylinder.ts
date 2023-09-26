import { CYLINDER_MESH_NAME } from "./Constants";
// import HighlightBehavior from "./HandDragBehavior";
import { getChildMeshByName, log, resetRotation } from "./utils";
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
import { FireExtinguisher } from "./FireExtinguisher";

export class PostSceneCylinder extends Interact {

    particleSystem: ParticleSystem;
    instances: Array<Cylinder>;
    
    // @ts-ignore
    fireExtinguisher: FireExtinguisher

    constructor(scene: Scene, cylinderInstances: Array<Cylinder>, guiManager: GUIManager, soundManager: SoundManager, xrCamera: WebXRDefaultExperience, fireExtinguisher: FireExtinguisher) {
        super(scene, cylinderInstances, guiManager, soundManager, xrCamera, fireExtinguisher);
        this.instances = cylinderInstances;
        this.fireExtinguisher = fireExtinguisher;
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
    }
}
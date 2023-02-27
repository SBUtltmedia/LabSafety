import { CYLINDER_MESH_NAME } from "./Constants";
import HighlightBehavior from "./HighlightBehavior";
import { getChildMeshByName } from "./utils";
import SOP from './SOP';
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Animation } from '@babylonjs/core/Animations/animation';
import { Nullable } from "@babylonjs/core/types";
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
            console.log("DRAGGING");
            const highlightingTheDrag = getChildMeshByName(cylinder, CYLINDER_MESH_NAME).getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
            let hitDetected = false;
            for (let singleMesh of filteredMeshes) {
                let leftCollision = getChildMeshByName(singleMesh, 'LEFT_COLLISION');
                let rightCollision = getChildMeshByName(singleMesh, 'RIGHT_COLLISION');
                let targetCylinder = getChildMeshByName(singleMesh, CYLINDER_MESH_NAME);
                if (cylinder.intersectsMesh(leftCollision) || cylinder.intersectsMesh(rightCollision)) {
                    hitDetected = true;
                    let to = singleMesh.name.split('-')[2];
                    let from = cylinder.name.split('-')[2];
                    let fromAndTo = `${from}to${to}`
                    if (sop.tasks[sop.currentState].label === fromAndTo) {
                        if (sop.tasks[sop.currentState].next === 'complete') {
                            window.location.assign('.');
                        } else {
                            sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
                        }
                    }
                    if (highlightingTheDrag) {
                        highlightingTheDrag.highlightMesh((sourceCylinder as Mesh));
                        highlightingTheDrag.highlightMesh((targetCylinder as Mesh));
                        if (cylinder.intersectsMesh(leftCollision)) {
                            targetCylinder.rotation.y = Math.PI;
                            sourceCylinder.rotation.y = 0;
                        } else {
                            targetCylinder.rotation.y = 0;
                            sourceCylinder.rotation.y = Math.PI;
                        }
                        if (!rotationFlag) {
                            //console.log("rotation is still pie!");
                            let individualAnimation = sourceCylinder.getAnimationByName(`${cylinderLetters[i]}-rotateAroundZ`);
                            rotationFlag = true;
                            scene.beginDirectAnimation(sourceCylinder, [individualAnimation], 0, 60, false, undefined, () => {

                            });
                        }
                    }
                    break;
                } else {
                    highlightingTheDrag.unhighlightMesh((targetCylinder as Mesh));
                }
            }
            if (hitDetected == false) {
                highlightingTheDrag.unhighlightMesh((sourceCylinder as Mesh));
                //highlightingTheDrag.unhighlightMesh((targetCylinder as Mesh));
                //sourceCylinder.rotation.z = Math.PI * 2;
                let individualAnimation = sourceCylinder.getAnimationByName(`${cylinderLetters[i]}-resetRotateAroundZ`);
                if (rotationFlag) {
                    rotationFlag = false;
                    scene.beginDirectAnimation(sourceCylinder, [individualAnimation], 0, 60, false, undefined, () => {
                    });
                }
            }
        });
        (gotSomething as PointerDragBehavior).onDragEndObservable.add(() => {
            const highlightingTheDrag = getChildMeshByName(cylinder, CYLINDER_MESH_NAME).getBehaviorByName('Highlight') as Nullable<HighlightBehavior>;
            for (let singleMesh of filteredMeshes) {
                let leftCollision = getChildMeshByName(singleMesh, 'LEFT_COLLISION');
                let rightCollision = getChildMeshByName(singleMesh, 'RIGHT_COLLISION');
                let targetCylinder = getChildMeshByName(singleMesh, CYLINDER_MESH_NAME);
                highlightingTheDrag.unhighlightMesh((sourceCylinder as Mesh));
                highlightingTheDrag.unhighlightMesh((targetCylinder as Mesh));
                if (sourceCylinder.intersectsMesh(leftCollision) || sourceCylinder.intersectsMesh(rightCollision)) {
                    let individualAnimation = sourceCylinder.getAnimationByName(`${cylinderLetters[i]}-resetRotateAroundZ`);
                    if (sourceCylinder.rotation.z == 4.62) {
                        scene.beginDirectAnimation(sourceCylinder, [individualAnimation], 0, 60, false, undefined, () => {

                        });
                    }
                    //sourceCylinder.rotation.z = Math.PI * 2;
                }
            }
        })
    }
}
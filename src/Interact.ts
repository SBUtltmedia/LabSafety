import { AbstractMesh, Mesh, Scene } from "@babylonjs/core";
import { Cylinder } from "./Cylinder"
import { CYLINDER_MESH_NAME, sop } from "./Constants";
import { getChildMeshByName } from "./utils";

export abstract class Interact {
    cylinderInstances: Array<Cylinder>;
    clipboard: AbstractMesh;
    scene: Scene;
    labels: Array<string>

    constructor(scene) {
        this.labels = ["A", "B", "C"];
        this.scene = scene;
    }

    updateSOPTask(from: string, to: string) {
        let fromAndTo = `${from}to${to}`;
        if (sop.tasks[sop.currentState].label === fromAndTo) {
            if (sop.tasks[sop.currentState].next === 'complete') {
                window.location.assign('.');
            } else {
                sop.currentState = sop.tasks.indexOf(sop.tasks.find((value,) => value.label == sop.tasks[sop.currentState].next));
            }
        }        
    }

    intersectHandCylinder(handMesh) {
        for (let i of this.labels){
             let cylinder = this.scene.getMeshByName(`pivot-Cylinder-${i}`);
             if (handMesh.intersectsMesh(cylinder, false)) {
                 return cylinder;
             }
         }
         return null;   
     }

    intersectCylinder(sourceCylinder) {
        for (let i of this.labels) {
            let cylinder = this.scene.getMeshByName(`pivot-Cylinder-${i}`);
            if (cylinder == sourceCylinder) continue;
            if (sourceCylinder.intersectsMesh(cylinder)) {
                return cylinder;
            }
        }
        return false;
    }

    highlightAndRotateCylinders(sourceCylinder: Cylinder, targetCylinder: Cylinder, rotationFlag: boolean) {   
        //@ts-ignore
        sourceCylinder.highlight();
        targetCylinder.highlight();

        let current_x = sourceCylinder.mesh.getAbsolutePosition()._x;
        let target_x = targetCylinder.mesh.getAbsolutePosition()._x;

        if (target_x < current_x) { // left hit
            console.log("Left hit!");

            sourceCylinder.mesh.rotation.y = Math.PI;
            targetCylinder.mesh.rotation.y = sourceCylinder.mesh.rotation.y;
        } else {
            console.log("Right hit!");
            sourceCylinder.mesh.rotation.y = 0;
            targetCylinder.mesh.rotation.y = sourceCylinder.mesh.rotation.y;
        }
        if (!rotationFlag) {
            rotationFlag = true;

            let sizes = sourceCylinder.mesh.getHierarchyBoundingVectors();
            let ySize = sizes.max.y - sizes.min.y;
            let offset = -0.09;
            let xPos = target_x;
            let deltaX = current_x - xPos;

            let sourceCylinderMesh = getChildMeshByName(sourceCylinder.mesh, CYLINDER_MESH_NAME);

            if (target_x < current_x) {
                console.log("Src pos: ", sourceCylinder.position.x);
                sourceCylinderMesh.position.x = deltaX + offset;
                sourceCylinderMesh.position.y = ySize - 0.2;
            } else {
                sourceCylinderMesh.position.x = deltaX - offset;
                sourceCylinderMesh.position.y = ySize - 0.2;
            }

            sourceCylinder.rotateAroundZ();
        }
        return rotationFlag;
    }
}
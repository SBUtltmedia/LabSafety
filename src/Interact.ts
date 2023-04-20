import { AbstractMesh, Color3, Mesh, Scene, Vector3 } from "@babylonjs/core";
import { Cylinder } from "./Cylinder"
import { CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME, sop } from "./Constants";
import { getChildMeshByName } from "./utils";
import { SceneManager } from "./PostSceneCylinderBehavior";

export abstract class Interact {
    cylinderInstances: Array<Cylinder>;
    clipboard: AbstractMesh;
    scene: Scene;
    labels: Array<string>

    constructor(scene, cylinderInstances: Array<Cylinder>) {
        this.labels = ["A", "B", "C"];
        this.scene = scene;
        this.cylinderInstances = cylinderInstances;
    }

    getCylinderInstanceFromMesh(cylinder) {
        let name = cylinder.name.split("-")[2];
        console.log("Name: ", name);
        for (let instance of this.cylinderInstances) {
            console.log("Instance name: ", instance.name);
            if (instance.name == name) {
                return instance;
            }
        }
        return null;
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
        return null;
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

    moveWithCollisions(cylinderMesh: AbstractMesh, delta: Vector3) {
        cylinderMesh.moveWithCollisions(delta);
    }

    addColors(sourceInstance: Cylinder, targetInstance: Cylinder) {
        let sourceColor = sourceInstance.currentColor;
        let targetColor = targetInstance.currentColor;

        console.log(sourceColor, targetColor);

        let newColor: Color3 = new Color3((sourceColor.r + targetColor.r) / 2, (sourceColor.g + targetColor.g) / 2, (sourceColor.b + targetColor.b) / 2);
        targetInstance.setColor(newColor);        
    }
}
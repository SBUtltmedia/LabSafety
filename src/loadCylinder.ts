import { AbstractMesh, Color3, HighlightLayer, Mesh, MeshBuilder, PointerDragBehavior, StandardMaterial, Vector3 } from "@babylonjs/core";
import { CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME } from "./constants";
import HighlightBehavior from "./HighlightBehavior";
import { getChildMeshByName } from "./utils";


/**
 * 
 * @param cylinderMesh Cylinder Mesh needed that will be modified
 * @param i Used to seperate the distance of the cylinders across the X axises
 * @param name Hard coded name we want to add to the cylinder mesh
 * @param color Type of color we want. Sorta hard coded from the the app.ts
 * 
 * Creates an ellipsoid around the cylinder as a way to add collision (babylon sees collision in ellipsoides).
 * Goes into the children meshes of the cylinder to change them to 'cylinder' and 'liquid'
 * Finally adds color to the liquid, highlighting behavior, and drag with collision
 * Commented out code on the top is if you want to use a box instead of an ellipsoid as a parent
 * (only difference in how the user can drag the cylinder) 
 */
//? We might wanna add the ability to change it based off rotation
export const createCylinder = (cylinderMesh: Mesh, i: number, name: string, color: Color3) => {
    //let beakerMesh = getChildMeshByName(cylinderMesh as AbstractMesh, 'BeakerwOpacity')!;
    //let beakerBounding = beakerMesh.getBoundingInfo().boundingBox;
    // let beakerWidth = beakerBounding.maximum.z - beakerBounding.minimum.z;
    // let beakerHeight = beakerBounding.maximum.y - beakerBounding.minimum.y;
    // let beakerDepth = beakerBounding.maximum.x - beakerBounding.minimum.x;
    //let base: Mesh = MeshBuilder.CreateBox(`pivot-${name}`, { size: 1, height: beakerHeight, width: beakerWidth, depth: beakerDepth }, cylinderMesh.getScene());

    //Adding a parent to the cylinder mesh and moving said parent to a valid position
    let base: Mesh = MeshBuilder.CreateSphere(`pivot-${name}`, { diameterX: 0.15, diameterY: 0.33, diameterZ: 0.2 }, cylinderMesh.getScene());
    base.visibility = 0;
    cylinderMesh.name = name;
    cylinderMesh.parent = base;
    base.position.x = -2 + i;
    base.position.y = 1.5;
    base.position.z = 0.5;
    base.checkCollisions = true;
    base.ellipsoid = new Vector3(0.02, 0.2, 0.2);

    //Just changing the names of the beakerwOpacity to cylinder and BeakerLiquid to liquid
    cylinderMesh.getChildMeshes().forEach(childMesh => {
        switch (childMesh.name) {
            case 'BeakerwOpacity':
                childMesh.name = CYLINDER_MESH_NAME;
                break;
            case 'BeakerLiquid':
                childMesh.name = CYLINDER_LIQUID_MESH_NAME;
                break;
        }
    });

    //Adding color to the cylinder
    const cylinderLiquid: AbstractMesh = getChildMeshByName(cylinderMesh as AbstractMesh, CYLINDER_LIQUID_MESH_NAME)!;
    const cylinderLiquidMaterial = new StandardMaterial('liquid-material');
    cylinderLiquidMaterial.diffuseColor = color;
    cylinderLiquid.material = cylinderLiquidMaterial;

    //Highlight behavior used for later
    const highlightLayer: HighlightLayer = new HighlightLayer('highlight-layer');
    highlightLayer.innerGlow = true;
    highlightLayer.outerGlow = false;
    highlightLayer.isEnabled = false;
    getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME).addBehavior(new HighlightBehavior(highlightLayer, Color3.Green()));

    addDragCollision(base);
}



/**
 * 
 * @param mesh Mesh to add pointer drag behavior on
 * 
 * Creates a draggable mesh that can collide and cannot move on the Z axis.
 */

function addDragCollision(mesh: Mesh) {
    let pointerDragBehaviors = new PointerDragBehavior({
        dragPlaneNormal: new Vector3(0, 0, 1),
    });

    pointerDragBehaviors.moveAttached = false
    pointerDragBehaviors.onDragObservable.add((eventData) => {
        mesh.moveWithCollisions(eventData.delta)
    })
    pointerDragBehaviors.onDragEndObservable.add((event) => {
        mesh.position.z = 0.5;
    })
    mesh.addBehavior(pointerDragBehaviors)
}
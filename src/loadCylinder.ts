import { AbstractMesh, Color3, HighlightLayer, Mesh, MeshBuilder, PointerDragBehavior, Scene, StandardMaterial, Vector3, Animation, DynamicTexture } from "@babylonjs/core";
import { CYLINDER_LIQUID_MESH_NAME, CYLINDER_MESH_NAME, NUMBER_OF_CYLINDERS, TIME_UNTIL_FADE } from "./Constants";
import HighlightBehavior from "./HighlightBehavior";
import { getChildMeshByName } from "./utils";


/**
 * 
 * @param cylinderMesh Cylinder Mesh needed that will be modified
 * @param i Used to seperate the distance of the cylinders across the X axises
 * @param name Hard coded name we want to add to the cylinder mesh
 * @param color Type of color we want. Sorta hard coded from the the app.ts
 * 
 * @summary Creates an ellipsoid around the cylinder as a way to add collision (babylon sees collision in ellipsoides).
 *          Goes into the children meshes of the cylinder to change them to 'cylinder' and 'liquid'
 *          It seperates the cylinders inorder and evenly spaced out based off the amount iof cylinder
 *          Finally adds color to the liquid, highlighting behavior, and drag with collision
 *          Commented out code on the top is if you want to use a box instead of an ellipsoid as a parent
 *          (only difference in how the user can drag the cylinder) 
 */
//? We might wanna add the ability to change the vector of the row on how the cylinders spawn in
export const createCylinder = (cylinderMesh: Mesh, i: number, name: string, color: Color3) => {
    //let beakerMesh = getChildMeshByName(cylinderMesh as AbstractMesh, 'BeakerwOpacity')!;
    //let beakerBounding = beakerMesh.getBoundingInfo().boundingBox;
    // let beakerWidth = beakerBounding.maximum.z - beakerBounding.minimum.z;
    // let beakerHeight = beakerBounding.maximum.y - beakerBounding.minimum.y;
    // let beakerDepth = beakerBounding.maximum.x - beakerBounding.minimum.x;
    //let base: Mesh = MeshBuilder.CreateBox(`pivot-${name}`, { size: 1, height: beakerHeight, width: beakerWidth, depth: beakerDepth }, cylinderMesh.getScene());
    const scene: Scene = cylinderMesh.getScene();
    const table: AbstractMesh = scene.getMeshByName('Table')!;
    //Adding a parent to the cylinder mesh and moving said parent to a valid position
    let base: Mesh = MeshBuilder.CreateSphere(`pivot-${name}`, { diameterX: 0.15, diameterY: 0.33, diameterZ: 0.2 }, cylinderMesh.getScene());
    base.visibility = 0;
    cylinderMesh.name = name;
    cylinderMesh.parent = base;
    cylinderMesh.rotationQuaternion = null;
    let topLeftColliderDetection = MeshBuilder.CreateBox("LEFT_COLLISION")
    topLeftColliderDetection.scaling.y = 0.01;
    topLeftColliderDetection.scaling.x = 0.04;
    topLeftColliderDetection.scaling.z = 0.04;
    topLeftColliderDetection.parent = base;
    topLeftColliderDetection.position.y += 0.3;
    topLeftColliderDetection.position.x -= 0.15;
    topLeftColliderDetection.visibility = 0;

    let topRightColliderDetection = MeshBuilder.CreateBox("RIGHT_COLLISION")
    topRightColliderDetection.scaling.y = 0.01;
    topRightColliderDetection.scaling.x = 0.04;
    topRightColliderDetection.scaling.z = 0.04;
    topRightColliderDetection.parent = base;
    topRightColliderDetection.position.y += 0.3;
    topRightColliderDetection.position.x += 0.15;
    topRightColliderDetection.visibility = 0;
    //topColliderDetection.scaling = new Vector3(0.01, 0.01, 0.01);
    //Just changing the names of the beakerwOpacity to cylinder and BeakerLiquid to liquid
    cylinderMesh.getChildMeshes().forEach(childMesh => {
        switch (childMesh.name) {
            case 'BeakerwOpacity':
                childMesh.name = CYLINDER_MESH_NAME;
                childMesh.rotationQuaternion = null;
                childMesh.rotation.z = 2 * Math.PI;
                childMesh.isPickable = false;
                break;
            case 'BeakerLiquid':
                childMesh.name = CYLINDER_LIQUID_MESH_NAME;
                childMesh.isPickable = false;
                break;
        }
    });
    //cylinderMesh.rotation.y = Math.PI;
    //If we are able to put it to a table then set it on top of that
    if (table) {
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        const cylinderOpacity = getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME)!;
        const cylinderOpacityBoundingBox = cylinderOpacity.getBoundingInfo().boundingBox;
        const cylinderVerticalOffset = cylinderOpacityBoundingBox.maximum.y + 0.00001;
        base.position.y = tableBoundingBox.maximumWorld.y + cylinderVerticalOffset;
        //const spanOfTable = (((tableBoundingBox.maximumWorld.x - tableBoundingBox.minimumWorld.x) / NUMBER_OF_CYLINDERS) * i) + tableBoundingBox.minimumWorld.x - .3;
        base.position.x = (((tableBoundingBox.maximumWorld.x - tableBoundingBox.minimumWorld.x) / NUMBER_OF_CYLINDERS) * i) + tableBoundingBox.minimumWorld.x - .3;
        base.position.z = (tableBoundingBox.centerWorld.z + tableBoundingBox.minimumWorld.z) / 2;
    } else {
        base.position.x = -2 + i;
        base.position.y = 1.22;
        base.position.z = 0.5;
    }
    base.checkCollisions = true;
    base.ellipsoid = new Vector3(0.02, 0.160, 0.02);


    //Adding color to the cylinder
    const cylinderLiquid: AbstractMesh = getChildMeshByName(cylinderMesh as AbstractMesh, CYLINDER_LIQUID_MESH_NAME)!;
    const cylinderLiquidMaterial = new StandardMaterial('liquid-material');
    cylinderLiquidMaterial.diffuseColor = color;
    cylinderLiquid.material = cylinderLiquidMaterial;


    const cylinderLabel: AbstractMesh = getChildMeshByName(cylinderMesh as AbstractMesh, "Label")!;
    //const cylinderLabelMaterial = new StandardMaterial('liquid-material');
    //cylinderLabelMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
    //cylinderLabel.material = cylinderLabelMaterial;
    const texture: DynamicTexture = new DynamicTexture("dynamic texture", 256, scene);
    // texture.wAng = -Math.PI / 2;
    texture.uAng = Math.PI;
    const material: StandardMaterial = new StandardMaterial("Mat", scene);
    material.diffuseTexture = texture;
    cylinderLabel.material = material;
    const font: string = "bold 220px monospace";
    texture.drawText(cylinderMesh.name.split("-")[1].toUpperCase(), 65, 185, font, "black", "white");
    //placard.addChild(labelPlacard);

    //Highlight behavior used for later
    const highlightLayer: HighlightLayer = new HighlightLayer('highlight-layer');
    highlightLayer.innerGlow = true;
    highlightLayer.outerGlow = false;
    highlightLayer.isEnabled = false;
    getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME)!.addBehavior(new HighlightBehavior(highlightLayer, Color3.Green()));
    addDragCollision(base, base.position.x, base.position.y, base.position.z);
}



/**
 * 
 * @param mesh Mesh to add pointer drag behavior on
 * @param originalX Original X point of the pivot mesh
 * @param originalY Original Y point of the pivot mesh
 * @param originalZ Original Z point of the pivot mesh
 * @summary Creates a draggable mesh that can collide and cannot move on the Z axis.
 *          On start of its dragging it clears the respawn timer
 *          After the dragging is done it creates a timer for the cylinder if it's 
 *          interrupted the cylinder respawns to original points
 */

function addDragCollision(mesh: Mesh, originalX: number, originalY: number, originalZ: number) {
    let thisInterval: number;
    let pointerDragBehavior = new PointerDragBehavior({
        dragPlaneNormal: new Vector3(0, 0, 1), //What limits our axis
    });
    pointerDragBehavior.useObjectOrientationForDragging = false;
    //pointerDragBehavior.startAndReleaseDragOnPointerEvents = false
    pointerDragBehavior.moveAttached = false
    pointerDragBehavior.onDragStartObservable.add(() => {
        if (thisInterval) {
            clearTimeout(thisInterval);
        }
    })
    pointerDragBehavior.onDragObservable.add((eventData) => {
        mesh.moveWithCollisions(eventData.delta); //not gonna lie dont even know how it works but it does
    })
    pointerDragBehavior.onDragEndObservable.add(() => {
        thisInterval = setTimeout(() => fadeAndRespawn(mesh, originalX, originalY, originalZ), TIME_UNTIL_FADE); //Change time until fade for faster/slower respawn time
    })
    mesh.addBehavior(pointerDragBehavior)
}

/**
 * 
 * @param mesh Pivot mesh used to move the whole cylinder
 * @param originalX Original X point of the pivot mesh
 * @param originalY Original Y point of the pivot mesh
 * @param originalZ Original Z point of the pivot mesh
 * 
 * @summary Fade creates a interval to decrease the cylinder visibility every 50 ms, and then after a second increases cylinder
 *          visibility every 50 seconds
 */
function fadeAndRespawn(mesh: Mesh, originalX: number, originalY: number, originalZ: number) {
    mesh.isPickable = false;
    let getMeshLetter = mesh.name.split('-')[0];
    let scene = mesh.getScene();
    let childrenMeshes = mesh.getChildMeshes();
    let cylinder = childrenMeshes.find((mesh) => mesh.name === 'cylinder')!;
    let liquid = childrenMeshes.find((mesh) => mesh.name === 'liquid')!;
    let liquidVisibilityInitial = liquid.visibility;
    let turnInvisibleCylinder = new Animation('InvisibilityOfCylinder', 'visibility', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    let turnVisibleCylinder = new Animation('VisibilityOfCylinder', 'visibility', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    let turnInvisibleLiquid = new Animation('InvisibilityOfLiquid', 'visibility', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    let turnVisibleLiquid = new Animation('VisibilityOfLiquid', 'visibility', 120, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keyFramesInvisibleLiquid = [];
    keyFramesInvisibleLiquid.push({
        frame: 0,
        value: liquidVisibilityInitial
    });
    keyFramesInvisibleLiquid.push({
        frame: 60,
        value: 0
    });
    const keyFramesVisibleLiquid = [];

    keyFramesVisibleLiquid.push({
        frame: 0,
        value: 0
    });
    keyFramesVisibleLiquid.push({
        frame: 60,
        value: liquidVisibilityInitial
    });

    const keyFramesInvisibleCylinder = [];
    keyFramesInvisibleCylinder.push({
        frame: 0,
        value: 1
    });
    keyFramesInvisibleCylinder.push({
        frame: 60,
        value: 0
    });
    const keyFramesVisibleCylinder = [];

    keyFramesVisibleCylinder.push({
        frame: 0,
        value: 0
    });
    keyFramesVisibleCylinder.push({
        frame: 60,
        value: 1
    });



    cylinder.animations.push(turnInvisibleCylinder);
    cylinder.animations.push(turnVisibleCylinder);

    liquid.animations.push(turnInvisibleLiquid);
    liquid.animations.push(turnVisibleLiquid);

    turnInvisibleCylinder.setKeys(keyFramesInvisibleCylinder);
    turnVisibleCylinder.setKeys(keyFramesVisibleCylinder);

    turnInvisibleLiquid.setKeys(keyFramesInvisibleLiquid);
    turnVisibleLiquid.setKeys(keyFramesVisibleLiquid);
    scene.beginDirectAnimation(cylinder, [turnInvisibleCylinder], 0, 60, false);
    scene.beginDirectAnimation(liquid, [turnInvisibleLiquid], 0, 60, false, undefined, () => {
        cylinder.rotation.z = Math.PI * 2;
        mesh.position.x = originalX;
        mesh.position.y = originalY;
        mesh.position.z = originalZ;
        let cylinderRotation = cylinder.getAnimationByName(`${getMeshLetter}-rotateAroundZ`);
        scene.beginDirectAnimation(cylinder, [turnVisibleCylinder], 0, 60, false);
        scene.beginDirectAnimation(liquid, [turnVisibleLiquid], 0, 60, false, undefined, () => {
            mesh.isPickable = true;
        });
    });

}
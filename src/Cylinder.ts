// import { AbstractMesh, Color3, HighlightLayer, Mesh, MeshBuilder, PointerDragBehavior, Scene, StandardMaterial, Vector3, Animation, DynamicTexture } from "@babylonjs/core";
import {
    CYLINDER_LIQUID_MESH_NAME,
    CYLINDER_MESH_NAME,
    NUMBER_OF_CYLINDERS,
    TIME_UNTIL_FADE,
} from "./Constants";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Animation } from "@babylonjs/core/Animations/animation";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { getChildMeshByName, resetPosition, resetRotation } from "./utils";
import { ParticleSystem, Texture } from "@babylonjs/core";
import { Hand } from "./Hand";
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
export class Cylinder {
    name: String;
    position: Vector3;
    mesh: Mesh;
    dragCollision: PointerDragBehavior;
    highlightLayer: HighlightLayer;
    scene: Scene;
    particleSystem: ParticleSystem;
    currentColor: Color3;
    originalColor: Color3;
    startOpacity: number;
    toggleControllers: any;
    constructor(cylinderMesh: Mesh, i: number, name: string, color: Color3) {
        console.log(cylinderMesh);
        this.name = name;

        this.currentColor = color;
        this.originalColor = color;
        this.startOpacity = 0.7;

        const scene: Scene = cylinderMesh.getScene();
        this.scene = scene;
        this.highlightLayer = new HighlightLayer("highlight-layer", scene);

        this.highlightLayer.innerGlow = true;
        this.highlightLayer.outerGlow = false;

        const table: AbstractMesh = scene.getMeshByName("Table")!;
        let base: Mesh = MeshBuilder.CreateSphere(
            `pivot-Cylinder-${name}`,
            { segments: 2, diameterX: 0.15, diameterY: 0.33, diameterZ: 0.2 },
            cylinderMesh.getScene()
        );
        base.visibility = 0;
        cylinderMesh.name = name;
        cylinderMesh.parent = base;
        cylinderMesh.rotationQuaternion = null;

        cylinderMesh.getChildMeshes().forEach((childMesh) => {
            switch (childMesh.name) {
                case "BeakerwOpacity":
                    childMesh.name = CYLINDER_MESH_NAME;
                    childMesh.rotationQuaternion = null;
                    childMesh.rotation.z = 2 * Math.PI;
                    childMesh.isPickable = false;
                    break;
                case "BeakerLiquid":
                    childMesh.name = CYLINDER_LIQUID_MESH_NAME;
                    childMesh.isPickable = false;
                    break;
            }
        });

        //If we are able to put it to a table then set it on top of that
        if (table) {
            const tableBoundingBox = table.getBoundingInfo().boundingBox;
            const cylinderOpacity = getChildMeshByName(
                cylinderMesh,
                CYLINDER_MESH_NAME
            )!;
            const cylinderOpacityBoundingBox =
                cylinderOpacity.getBoundingInfo().boundingBox;
            const cylinderVerticalOffset = cylinderOpacityBoundingBox.maximum.y;
            console.log(cylinderVerticalOffset);
            base.position.y =
                tableBoundingBox.maximumWorld.y + cylinderVerticalOffset / 2 + 0.05;
            //const spanOfTable = (((tableBoundingBox.maximumWorld.x - tableBoundingBox.minimumWorld.x) / NUMBER_OF_CYLINDERS) * i) + tableBoundingBox.minimumWorld.x - .3;
            base.position.x =
                ((tableBoundingBox.maximumWorld.x - tableBoundingBox.minimumWorld.x) /
                    NUMBER_OF_CYLINDERS) *
                i +
                tableBoundingBox.minimumWorld.x -
                0.3;
            base.position.z =
                (tableBoundingBox.centerWorld.z + tableBoundingBox.minimumWorld.z) / 2;
            //@ts-ignore
            this.position = { ...base.position };
        } else {
            base.position.x = -2 + i;
            base.position.y = 1.22;
            base.position.z = 0.5;
            console.log("Else!");
        }
        base.checkCollisions = true;
        base.ellipsoid = new Vector3(0.02, 0.12, 0.02);
        console.log(base.ellipsoid.length());

        this.mesh = base;

        //Adding color to the cylinder
        const cylinderLiquid: AbstractMesh = getChildMeshByName(
            cylinderMesh as AbstractMesh,
            CYLINDER_LIQUID_MESH_NAME
        )!;
        const cylinderLiquidMaterial = new StandardMaterial("liquid-material");
        cylinderLiquidMaterial.diffuseColor = color;
        cylinderLiquid.material = cylinderLiquidMaterial;

        const cylinderLabel: AbstractMesh = getChildMeshByName(
            cylinderMesh as AbstractMesh,
            "Label"
        )!;
        const cylinderLabel2: AbstractMesh = getChildMeshByName(
            cylinderMesh as AbstractMesh,
            "LabelBack"
        )!;

  
        console.log("Label:", cylinderLabel2);

        //const cylinderLabelMaterial = new StandardMaterial('liquid-material');
        //cylinderLabelMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
        //cylinderLabel.material = cylinderLabelMaterial;
        const texture: DynamicTexture = new DynamicTexture(
            "dynamic texture",
            256,
            scene,
            true,
            Texture.LINEAR_LINEAR_MIPNEAREST
        );
         texture.uAng = Math.PI;
        const material: StandardMaterial = new StandardMaterial("Mat", scene);
        material.diffuseTexture = texture;
        cylinderLabel.material = material;
        cylinderLabel2.material = material;
        const font: string = "bold 250px monospace";

        texture.drawText(
            cylinderMesh.name.toUpperCase(),
            0,
            225,
            font,
            "black",
            "white"
        );
        //placard.addChild(labelPlacard);

        //Highlight behavior used for later

        //  getChildMeshByName(cylinderMesh, CYLINDER_MESH_NAME)!.addBehavior(new HighlightBehavior(highlightLayer, Color3.Green()));

        let childrenMeshes = this.mesh.getChildMeshes();
        let cylinder = childrenMeshes.find((mesh) => mesh.name === "cylinder")!;

        this.mesh.animations = cylinder.animations;

        console.log("Children: ", this.mesh.getChildMeshes());

        const particleSystem = new ParticleSystem("particles", 500, this.scene);
        particleSystem.particleTexture = new Texture(
            "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png",
            this.scene
        );
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 0.7;
        particleSystem.emitRate = 100;
        particleSystem.gravity = new Vector3(0, 0.5, 0);
        particleSystem.minSize = 0.01;
        particleSystem.maxSize = 0.07;
        particleSystem.createPointEmitter(
            new Vector3(0, 0, 0),
            new Vector3(0, 1, 0)
        );
        particleSystem.addColorGradient(
            1,
            Color4.FromColor3(
                (cylinderLiquid.material as StandardMaterial).diffuseColor,
                1
            )
        );
        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        particleSystem.emitter = (this.mesh as AbstractMesh).position;

        this.particleSystem = particleSystem;

        this.setOpacity(this.startOpacity);

        this.addDragCollision();
    }

    startParticles() {
        this.particleSystem.start();
    }

    /**
     *
     * @summary Creates a draggable mesh that can collide and cannot move on the Z axis.
     *          On start of its dragging it clears the respawn timer
     *          After the dragging is done it creates a timer for the cylinder if it's
     *          interrupted the cylinder respawns to original points
     */

    highlight(isOn = true) {
        // let method=['removeMesh','addMesh'][Number(isOn)];
        // this.highlightLayer[method](this.mesh,  Color3.Green());

        let beaker = getChildMeshByName(this.mesh, CYLINDER_MESH_NAME);

        if (isOn) {
            console.log("Adding mesh");
            if (!this.highlightLayer.hasMesh(beaker)) {
                //@ts-ignore
                this.highlightLayer.addMesh(beaker, Color3.Green());
            }
        } else {
            if (this.highlightLayer.hasMesh(beaker)) {
                //@ts-ignore
                this.highlightLayer.removeMesh(beaker);
            }
        }
    }

    addDragCollision() {
        let thisInterval: number;
        let pointerDragBehavior = new PointerDragBehavior({
            dragPlaneNormal: new Vector3(0, 0, 1), //What limits our axis
        });
        pointerDragBehavior.useObjectOrientationForDragging = false;
        //pointerDragBehavior.startAndReleaseDragOnPointerEvents = false
        //pointerDragBehavior.dragButtons = [0,1,2]
        pointerDragBehavior.moveAttached = false;

        pointerDragBehavior.onDragStartObservable.add(() => {
            if (thisInterval) {
                clearTimeout(thisInterval);
            }
        });
        pointerDragBehavior.onDragObservable.add((eventData) => {
            this.mesh.moveWithCollisions(eventData.delta);
        });
        pointerDragBehavior.onDragEndObservable.add(() => {
            this.fadeAndRespawn();
        });
        this.mesh.addBehavior(pointerDragBehavior);
        this.dragCollision = pointerDragBehavior;
    }

    removeDragCollision() {
        this.mesh.removeBehavior(this.dragCollision);
    }

    /**
     *
     * @summary Fade creates a interval to decrease the cylinder visibility every 50 ms, and then after a second increases cylinder
     *          visibility every 50 seconds
     */
    fadeAndRespawn(
        timeUntilFade = TIME_UNTIL_FADE,
        handInstances: Hand[] = null
    ) {
        setTimeout(() => {
            let ptrDrag = this.mesh.getBehaviorByName("PointerDrag");
            if (ptrDrag) (ptrDrag as PointerDragBehavior).releaseDrag();

            this.mesh.isPickable = false;
            let endFrame = 60;
            let getMeshLetter = this.mesh.name.split("-")[0];
            let scene = this.mesh.getScene();
            let childrenMeshes = this.mesh.getChildMeshes();
            let cylinder = childrenMeshes.find((mesh) => mesh.name === "cylinder")!;
            let liquid = childrenMeshes.find((mesh) => mesh.name === "liquid")!;

            const cylinderLiquid: AbstractMesh = getChildMeshByName(
                this.mesh as AbstractMesh,
                CYLINDER_LIQUID_MESH_NAME
            )!;

            console.log("Visibility: ", cylinderLiquid.visibility);

            let animations = [
                { name: "Invisibility", startValue: cylinderLiquid.visibility },
                { name: "Visibility", startValue: 0 },
            ];

            animations.forEach((animation) => {
                animation["init"] = new Animation(
                    animation.name,
                    "visibility",
                    120,
                    Animation.ANIMATIONTYPE_FLOAT,
                    Animation.ANIMATIONLOOPMODE_CONSTANT
                );
                animation["init"].setKeys([
                    { frame: 0, value: animation.startValue },
                    {
                        frame: endFrame,
                        value: cylinderLiquid.visibility - animation.startValue,
                    },
                ]);
            });

            for (let i = 0; i < childrenMeshes.length - 1; ++i) {
                let mesh = childrenMeshes[i];
                scene.beginDirectAnimation(mesh, [animations[0]["init"]], 0, 60, false);
            }

            scene.beginDirectAnimation(
                childrenMeshes[childrenMeshes.length - 1],
                [animations[0]["init"]],
                0,
                60,
                false,
                undefined,
                () => {
                    console.log(this.mesh, this.position);
                    //@ts-ignore
                    this.mesh.position.x = this.position._x;
                    this.mesh.position.y = this.position._y;
                    this.mesh.position.z = this.position._z;
                    this.mesh.animations = cylinder.animations;

                    let childMesh = getChildMeshByName(this.mesh, CYLINDER_MESH_NAME);

                    resetRotation(this.mesh);
                    resetRotation(childMesh);
                    resetPosition(childMesh);

                    for (let i = 0; i < childrenMeshes.length - 1; ++i) {
                        let mesh = childrenMeshes[i];
                        scene.beginDirectAnimation(
                            mesh,
                            [animations[1]["init"]],
                            0,
                            60,
                            false
                        );
                    }
                    scene.beginDirectAnimation(
                        childrenMeshes[childrenMeshes.length - 1],
                        [animations[1]["init"]],
                        0,
                        60,
                        false,
                        undefined,
                        () => {
                            this.highlight(false);
                            this.mesh.isPickable = true;

                            if (handInstances) {
                                for (let hand of handInstances) {
                                    if (hand) {
                                        hand.handMesh.visibility = 1;
                                    }
                                }
                            }
                        }
                    );
                }
            );
        }, timeUntilFade);
    }

    rotateAroundZ(hand: Hand = null) {
        let individualAnimation = this.mesh.getAnimationByName(
            `${this.name}-rotateAroundZ`
        );

        let oldHandData;

        if (hand) {
            oldHandData = [
                hand.motionController.lastPosition,
                hand.motionController.grabbed,
                hand.motionController.meshGrabbed,
                hand.holdingMesh,
                hand.holdingInstance,
                hand.motionController.meshGrabbed,
            ];

            hand.droppedWithoutRespawn();
            console.log("Dropped without respawn");
        }

        if (this.toggleControllers) this.toggleControllers();
        this.scene.beginDirectAnimation(
            getChildMeshByName(this.mesh, CYLINDER_MESH_NAME),
            [individualAnimation],
            0,
            60,
            false,
            undefined,
            () => {
                if (hand) {
                    hand.motionController.lastPosition = oldHandData[0];
                    hand.motionController.grabbed = oldHandData[1];
                    hand.motionController.meshGrabbed = oldHandData[2];
                    hand.holdingMesh = oldHandData[3];
                    hand.holdingInstance = oldHandData[4];
                    hand.motionController.meshGrabbed = oldHandData[5];
                }
                if (this.toggleControllers) this.toggleControllers();
            }
        );
    }

    resetAroundZ() {
        let individualAnimation = this.mesh.getAnimationByName(
            `${this.name}-resetRotateAroundZ`
        );
        this.scene.beginDirectAnimation(
            getChildMeshByName(this.mesh, CYLINDER_MESH_NAME),
            [individualAnimation],
            0,
            60,
            false,
            undefined,
            () => { }
        );
    }

    setColor(color: Color3) {
        const cylinderLiquid: AbstractMesh = getChildMeshByName(
            this.mesh as AbstractMesh,
            CYLINDER_LIQUID_MESH_NAME
        )!;
        const cylinderLiquidMaterial = new StandardMaterial("liquid-material");
        cylinderLiquidMaterial.diffuseColor = color;
        cylinderLiquid.material = cylinderLiquidMaterial;
        this.currentColor = color;
        console.log(this.currentColor);
    }

    setOpacity(opacity: number) {
        const cylinderLiquid: AbstractMesh = getChildMeshByName(
            this.mesh as AbstractMesh,
            CYLINDER_LIQUID_MESH_NAME
        )!;
        cylinderLiquid.visibility = opacity;
    }

    resetProperties() {
        this.setOpacity(this.startOpacity);
        this.setColor(this.originalColor);
    }

    showEffects(start = true) {
        if (start) {
            this.particleSystem.particleTexture = new Texture(
                "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png",
                this.scene
            );
            this.particleSystem.minLifeTime = 0.5;
            this.particleSystem.maxLifeTime = 0.7;
            this.particleSystem.emitRate = 100;
            this.particleSystem.gravity = new Vector3(0, 0.5, 0);
            this.particleSystem.minSize = 0.01;
            this.particleSystem.maxSize = 0.07;
            this.particleSystem.createPointEmitter(
                new Vector3(0, 0, 0),
                new Vector3(0, 1, 0)
            );
            const cylinderLiquid: AbstractMesh = getChildMeshByName(
                this.mesh as AbstractMesh,
                CYLINDER_LIQUID_MESH_NAME
            )!;
            this.particleSystem.addColorGradient(
                1,
                Color4.FromColor3(
                    (cylinderLiquid.material as StandardMaterial).diffuseColor,
                    1
                )
            );
            this.particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            this.particleSystem.emitter = this.mesh.position;
            this.particleSystem.start();
        } else {
            this.particleSystem.stop();
        }
    }
}

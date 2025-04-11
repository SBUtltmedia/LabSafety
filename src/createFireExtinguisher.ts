import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Nullable } from "@babylonjs/core/types";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { FireBehavior } from "./FireBehavior";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { SmokeParticles } from "./SmokeParticles";

import { InteractableBehavior } from "./interactableBehavior";
import { ActivationState } from "./interactionManager";
import { interactionManager } from "./scene";
import { FadeRespawnBehavior } from "./FadeRespawnBehavior";
import { HighlightBehavior } from "./HighlightBehavior";
import { Animatable, AnimationEvent, Color3, RayHelper } from "@babylonjs/core";
import { DEFAULT_BG, HIT_BG, HotspotEllipseMap } from "./startFire";
import { Animation } from "@babylonjs/core/Animations/animation";
import { Ellipse } from "@babylonjs/gui";



const FIRE_EXTINGUISHER_RANGE = 4.3;

export function createFireExtinguisher(mesh: Mesh): void {
    const interactableBehavior = new InteractableBehavior(interactionManager, {
        activatable: true,
        defaultAnchorRotation: new Vector3(-0.05, -0.20, Math.PI),
        defaultAnchorPosition: new Vector3(0.25, -0.1, 0)
    });

    const fadeRespawnBehavior = new FadeRespawnBehavior();
    const highlightBehavior = new HighlightBehavior(new Color3(0, 255, 0));

    mesh.addBehavior(interactableBehavior);
    mesh.addBehavior(fadeRespawnBehavior);
    mesh.addBehavior(highlightBehavior);

    highlightBehavior.unhighlightSelf();

    let smokeSystem = new SmokeParticles(mesh);

    let observer: Nullable<Observer<Scene>> = null;
    const scene = mesh.getScene();
    const debugSphere1 = MeshBuilder.CreateSphere("debug-sphere-1", {
        diameter: 0.1
    });
    const debugSphere2 = MeshBuilder.CreateSphere("debug-sphere-2", {
        diameter: 0.1
    });
    debugSphere1.isVisible = false;
    debugSphere2.isVisible = false;
    let timeout: number = null;
    let hightlightBehav = mesh.getBehaviorByName("Highlight") as HighlightBehavior;

    let hotspotStack = ["hotspot1", "hotspot2", "hotspot3", "hotspot2", "hotspot1"];

    let currentHotspot = hotspotStack[hotspotStack.length - 1];
    hotspotStack.pop();

    // interactableBehavior.onGrabStateChangedObservable.add((grabInfo) => {
    //     if (grabInfo.state === GrabState.GRAB) {
    //         debugSphere2.isVisible = true;
    //     } else {
    //         debugSphere2.isVisible = false;
    //     }
    // })    

    scene.onBeforeRenderObservable.add(() => {
        const hoseMesh = mesh.getChildren().find(cm => cm.name === "Hose") as Mesh;
        if (hoseMesh !== undefined) {
            const ray = new Ray(hoseMesh.absolutePosition, hoseMesh.getDirection(Axis.Z).normalize(), FIRE_EXTINGUISHER_RANGE);
            debugSphere1.setAbsolutePosition(ray.origin);
            debugSphere2.setAbsolutePosition(ray.origin.add(ray.direction.scale(ray.length)));

            const pickInfo = scene.pickWithRay(ray, pickedMesh => {
                const fireBehavior = pickedMesh.getBehaviorByName("Fire") as FireBehavior;
                const isEmitter = pickedMesh.name.startsWith("hotspot");
                return Boolean((fireBehavior && !fireBehavior.extinguished) || isEmitter);
            });
            
            if (pickInfo.hit && pickInfo.pickedMesh.name.startsWith("hotspot")) {
                hightlightBehav.highlightSelf(new Color3(0, 255, 0));
            } else {
                hightlightBehav.unhighlightSelf();
            }
        }
    });    

    let timeoutCleared = true;
    let prevRayHelper: RayHelper = null;
    let anim: Animatable = null;

    const fromColor = Color3.FromHexString(DEFAULT_BG);
    const toColor = Color3.FromHexString(HIT_BG);


    interactableBehavior.onActivationStateChangedObservable.add(({ state }) => {
        if (state === ActivationState.ACTIVE) {
            smokeSystem.start();
            observer = scene.onBeforeRenderObservable.add(() => {
                // Check for hitting the fire
                const hoseMesh = mesh.getChildren().find(cm => cm.name === "Hose") as Mesh;
                if (hoseMesh !== undefined) {
                    const ray = new Ray(hoseMesh.absolutePosition, hoseMesh.getDirection(Axis.Z).normalize(), FIRE_EXTINGUISHER_RANGE);
                    if (prevRayHelper !== null) {
                        prevRayHelper.dispose();
                    }
                    // const rayHelper = new RayHelper(ray);
                    // rayHelper.show(scene, new Color3(0, 255, 0));
                    // prevRayHelper = rayHelper;

                    debugSphere1.setAbsolutePosition(ray.origin);
                    debugSphere2.setAbsolutePosition(ray.origin.add(ray.direction.scale(ray.length)));

                    const pickInfo = scene.pickWithRay(ray, pickedMesh => {
                        const fireBehavior = pickedMesh.getBehaviorByName("Fire") as FireBehavior;
                        const isEmitter = pickedMesh.name.startsWith("hotspot");
                        return Boolean((fireBehavior && !fireBehavior.extinguished) || isEmitter);
                    });
                    
                    if (pickInfo.hit && pickInfo.pickedMesh.name.startsWith("hotspot")) {
                        let currentHotspotMesh = scene.getMeshByName(currentHotspot);
                        let pickedMesh = pickInfo.pickedMesh;

                        console.log("Hit!");

                        if (timeoutCleared && pickedMesh === currentHotspotMesh) {
                            timeoutCleared = false;
                            
                            let c1 = HotspotEllipseMap[pickedMesh.name];
                            let keys = [];

                            const animation = new Animation(
                                "guiColorTransition",
                                "background",
                                60,
                                Animation.ANIMATIONTYPE_COLOR3,
                                Animation.ANIMATIONLOOPMODE_CONSTANT
                            );

                            let numFrames = 100;
                        

                            for (let i = 0; i <= numFrames; i++) {
                                const lerpColor = Color3.Lerp(fromColor, toColor, i / numFrames);
                                keys.push({
                                    frame: i,
                                    value: lerpColor
                                });
                                animation.addEvent(new AnimationEvent(i, 
                                    (frame) => {
                                        let hexString = lerpColor.toHexString();
                                        c1.background = hexString;
                                    }, true)
                                );
                            }
                            animation.setKeys(keys);

                            c1.animations = [animation];
                            anim = scene.beginAnimation(c1, 0, numFrames, false, 5);
                            anim.onAnimationEnd = () => {
                                currentHotspotMesh.isVisible = false;
                                currentHotspotMesh.setEnabled(false);
                                c1.background = DEFAULT_BG;
                                if (hotspotStack.length > 0) {
                                    currentHotspot = hotspotStack[hotspotStack.length - 1];
                                    currentHotspotMesh = scene.getMeshByName(currentHotspot);
                                    hotspotStack.pop();
                                    scene.getMeshByName(currentHotspot).isVisible = true;
                                    scene.getMeshByName(currentHotspot).setEnabled(true);
                                }
                                timeoutCleared = true;
                            }
                        }
                    } else {
                        timeoutCleared = true;

                        for (let key of Object.keys(HotspotEllipseMap)) {
                            let c1 = HotspotEllipseMap[key];
                            let anim = scene.getAnimatableByTarget(c1);
                            if (anim) {
                                anim.onAnimationEnd = () => {};
                                scene.stopAnimation(c1);
                            }
                            c1.background = DEFAULT_BG;                        
                        }                     
                    }
                }
            });
            // @todo: Activate particles
        } else if (state === ActivationState.INACTIVE) {
            smokeSystem.stop();
            debugSphere2.isVisible = false;
            if (prevRayHelper !== null) {
                prevRayHelper.dispose();
            }            
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
                timeoutCleared = true;             
            }
            // Remove observer
            if (observer) {
                observer.remove();
                observer = null;
            }
            for (let key of Object.keys(HotspotEllipseMap)) {
                let c1 = HotspotEllipseMap[key];
                let anim = scene.getAnimatableByTarget(c1);
                if (anim) {
                    anim.onAnimationEnd = () => {};
                    scene.stopAnimation(c1);
                }
                c1.background = DEFAULT_BG;                        
            }            
            // @todo: Deactivate particles
        }
    });
}

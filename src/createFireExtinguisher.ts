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



const FIRE_EXTINGUISHER_RANGE = 8;

export function createFireExtinguisher(mesh: Mesh): void {
    const interactableBehavior = new InteractableBehavior(interactionManager, {
        activatable: true,
        defaultAnchorRotation: new Vector3(-0.05, -0, Math.PI),
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
  

    let prevRayHelper: RayHelper = null;

    let timeoutCleared = true;
    let anim: Animatable = null;

    const fromColor = Color3.FromHexString(DEFAULT_BG);
    const toColor = Color3.FromHexString(HIT_BG);

    const NUM_FRAMES = 100;

    let isRelease = false;


    let performHotspotAnimation = (c1: Ellipse, frame: number) => {
        if (c1.background === toColor.toHexString() || frame === NUM_FRAMES) {
            return;
        }
        const lerpColor = Color3.Lerp(fromColor, toColor, frame / NUM_FRAMES);

        c1.background = lerpColor.toHexString();

        if (!isRelease) {
            requestAnimationFrame(() => performHotspotAnimation(c1, frame + 1));
        } else {
            // reset back
            for (let hotspot of Object.keys(HotspotEllipseMap)) {
                let c = HotspotEllipseMap[hotspot];
                c.background = "#F00";
            }
        }
    }


    interactableBehavior.onActivationStateChangedObservable.add(({ state }) => {
        if (state === ActivationState.ACTIVE) {
            smokeSystem.start();
            observer = scene.onBeforeRenderObservable.add(() => {
                // Check for hitting the fire
                const hoseMesh = mesh.getChildren().find(cm => cm.name === "Hose") as Mesh;
                if (hoseMesh !== undefined) {
                    const ray = new Ray(new Vector3(hoseMesh.absolutePosition._x, hoseMesh.absolutePosition._y + 0.1, hoseMesh.absolutePosition._z), hoseMesh.getDirection(Axis.Z).normalize(), FIRE_EXTINGUISHER_RANGE);

                    debugSphere1.setAbsolutePosition(ray.origin);
                    debugSphere2.setAbsolutePosition(ray.origin.add(ray.direction.scale(ray.length)));

                    if (prevRayHelper !== null) {
                        prevRayHelper.dispose();
                    }
        
                    const rayHelper = new RayHelper(ray);
                    rayHelper.show(scene, new Color3(0, 255, 0));
                    prevRayHelper = rayHelper;                    

                    const olpickInfo = scene.pickWithRay(ray, pickedMesh => {
                        const isEmitter = pickedMesh.name.startsWith("hotspot");
                        return isEmitter;
                    });

                    if (olpickInfo.pickedMesh && olpickInfo.pickedMesh.name.startsWith("hotspot")) {
                        hightlightBehav.highlightSelf(new Color3(0, 255, 0));
                    } else {
                        hightlightBehav.unhighlightSelf();
                    }                    

                    const pickInfo = scene.pickWithRay(ray, pickedMesh => {
                        const fireBehavior = pickedMesh.getBehaviorByName("Fire") as FireBehavior;
                        const isEmitter = pickedMesh.name.startsWith("hotspot");
                        return Boolean((fireBehavior && !fireBehavior.extinguished) || isEmitter);
                    });
                    
                    if (pickInfo.hit && pickInfo.pickedMesh.name.startsWith("hotspot")) {
                        isRelease = false;

                        hightlightBehav.highlightSelf(new Color3(0, 255, 0));

                        let currentHotspotMesh = scene.getMeshByName(currentHotspot);
                        let pickedMesh = pickInfo.pickedMesh;


                        if (timeoutCleared && pickedMesh === currentHotspotMesh) {
                            console.log("Hit!");

                            timeoutCleared = false;

                            let c1 = HotspotEllipseMap[pickedMesh.name];

                            performHotspotAnimation(c1, 0);

                            timeout = setTimeout(() => {
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
                            }, 1000);
                        }
                    } else {
                        isRelease = true;
                        clearTimeout(timeout);
                        timeout = null;
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

            isRelease = true;


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
        }
    });
}

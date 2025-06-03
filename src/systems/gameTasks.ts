import { Scene } from "@babylonjs/core/scene";
import { Task } from "./task";
import { ListItem } from "../behaviors/updateClipboardBehavior";
import { PouringBehavior } from "../behaviors/pouringBehavior";
import { log } from "../utils";
import { Status } from "./task";
import { setupFires } from "../entities/startFire";
import { FireBehavior } from "../behaviors/fireBehavior";
import { GUIWindows } from "../managers/guiManager";
import { enablePointerLock, initScene, interactionManager } from "../scene";
import { global } from "../globalState";
import { setColor } from "../entities/createCylinder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder, Observable } from "@babylonjs/core";
import { NUM_FIRES } from "../Constants";
import { Animation } from '@babylonjs/core/Animations/animation';


interface ITaskMap {
    [key: string]: Task
}

export const finalGameState: Observable<Status> = new Observable();

let isFire = false;

export const setupTasks = (scene: Scene, listItems: ListItem[], cylinders: Array<string>) => {
    const fires = setupFires(scene);

    let taskList: Task[] = [];
    let reverseTaskMap: Map<Task, Array<string>> = new Map();

    let pouringTasks: Task[] = [];
    let taskMap: ITaskMap = {};

    listItems.forEach(item => {
        if (item.logic) {
            if (item.logic.taskType === "pouring") {
                setupPouringTask(scene, item, taskList, pouringTasks, taskMap, reverseTaskMap);
            }
        }
    })

    setupSOP(scene, pouringTasks, cylinders);

    for (let cylinderName of cylinders) {
        let fromMesh = scene.getMeshByName(cylinderName);
        let pouringBehavior = fromMesh.getBehaviorByName("Pouring") as PouringBehavior;

        pouringBehavior.onMidPourObservable.add(target => {
            log(`Pouring mesh name: ${pouringBehavior.mesh.name}`);
            log(`Poured mesh name: ${target.name}`);

            const targetColor = (target.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid").material as StandardMaterial).diffuseColor;
            const sourceColor = (pouringBehavior.mesh.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid").material as StandardMaterial).diffuseColor;

            const mixedColor = new Color3((targetColor.r + sourceColor.r) / 2, (targetColor.g + sourceColor.g) / 2, (targetColor.b + sourceColor.b) / 2);

            setColor(target, mixedColor);

            const task = reverseTaskMap.get(global.sop.currentSubTask);

            let taskSuccess = true;

            if (pouringBehavior.animating) {
                pouringBehavior.onAnimationChangeObservable.addOnce(() => {
                    taskSuccess = processTask(cylinderName, task[0], target.name, task[1], global.sop.currentSubTask, scene);
                })
            } else {
                taskSuccess = processTask(cylinderName, task[0], target.name, task[1], global.sop.currentSubTask, scene);
            }

            if (!taskSuccess) {
                const pouringBehavior = target.getBehaviorByName("Pouring") as PouringBehavior;
                pouringBehavior.startSmokes();
            }
        })
    }
    
    taskList.forEach(task => {
        task.onTaskStateChangeObservable.add(status => {
            if (status === Status.SUCCESSFUL) {
                if (!global.sounds.success.isPlaying && !global.sounds.explosion.isPlaying) {
                    log("Playing ding");
                    global.sounds.ding.stop();
                    global.sounds.ding.play();
                }
            }
        });            
    })

    global.taskList = taskList;
}

const processTask = (fromName: string, cylinderName: string, toName: string, targetName: string, task: Task, scene: Scene) => {
    if (cylinderName === fromName && toName === targetName) {
        task.succeed();
        return true;
    } else {
        task.fail();
        return false;
    }
}

const setupPouringTask = (scene: Scene, item: ListItem, taskList: Task[], pouringTasks: Task[], taskMap: ITaskMap, reverseTaskMap: Map<Task, string[]>) => {
    let name = item.taskName;
    let text = item.text;
    let logic = item.logic;
    let subtasks: Task[] = [];

    logic.subtasks.forEach(subtask => {
        let curTask = taskMap[subtask];
        if (curTask) subtasks.push(curTask);
    })

    let task: Task;

    if (subtasks.length) {
        task = new Task(name, text, [[...subtasks]]);
    } else {
        task = new Task(name, text, []);
    }

    taskList.push(task);
    pouringTasks.push(task);
    taskMap[name] = task;
    reverseTaskMap.set(task, [logic.from, logic.to]);
}

const setupSOP = (scene: Scene, pouringTasks: Task[], cylinders: Array<String>) => {
    global.sop = new Task("SOP", "Standard operating procedure for lab safety.", [pouringTasks]);

    global.sop.onTaskStateChangeObservable.add(status => {
        switch (status) {
            case Status.SUCCESSFUL:
                // Show success screen, play fanfare.
                let camera = scene.activeCamera;
                GUIWindows.createSuccessScreen(scene, () => {
                    enablePointerLock();
                    interactionManager.currentInteractionHandler.dispose();
                    initScene(scene);
                });
                global.sounds.success.stop();
                global.sounds.success.play();
                finalGameState.notifyObservers(Status.SUCCESSFUL);
                break;
            case Status.FAILURE:
                // Play explosion, start a fire.
                log("Fail SOP");
                global.sounds.explosion.stop();
                global.sounds.explosion.play();

                const whiteScreenMaterial = new StandardMaterial("whiteScreenMat", scene);
                whiteScreenMaterial.emissiveColor = new Color3(1, 1, 1);

                const whiteScreen = MeshBuilder.CreatePlane("whiteScreen", { size: 10 }, scene);
                whiteScreen.material = whiteScreenMaterial;
                whiteScreen.parent = scene.activeCamera;
                whiteScreen.position.z += 0.5;                

                for (let i = 1; i <= NUM_FIRES; i++) {
                    const emitter = scene.getMeshById(`emitter${i}`);
                    let fireBehavior = emitter.getBehaviorByName("Fire") as FireBehavior;
                    fireBehavior.onFireObservable.notifyObservers(true);    
                }

                whiteScreenMaterial.alpha = 1;
                const fadeOutAnimation = new Animation(
                    "fadeOut",
                    "material.alpha",
                    30, // Frame rate
                    Animation.ANIMATIONTYPE_FLOAT,
                    Animation.ANIMATIONLOOPMODE_CONSTANT
                );
            
                const keys = [
                    { frame: 0, value: 1 },
                    { frame: 30, value: 0.5 },
                    { frame: 60, value: 0 }
                ];
            
                fadeOutAnimation.setKeys(keys);
            
                whiteScreen.animations = [];
                whiteScreen.animations.push(fadeOutAnimation);
            
                // Start the animation
                scene.beginAnimation(whiteScreen, 0, 60, false, 1, () => {
                    // After animation finishes, hide the screen
                    whiteScreen.isVisible = false;
                });                

                let hotspots = [scene.getMeshByName("hotspot1"), scene.getMeshByName("hotspot2"), scene.getMeshByName("hotspot3")];
                hotspots[0].isVisible = true;
                hotspots[0].setEnabled(true);
                let obs = scene.onBeforeRenderObservable.add(() => {
                    let ok = true;
                    for (let hotspot of hotspots) {
                        if (hotspot.isVisible) {
                            ok = false;
                        }
                    }
    
                    if (ok) {
                        for (let i = 1; i <= NUM_FIRES; i++) {
                            let emitter = scene.getMeshByName(`emitter${i}`)
                            let fireBehavior = emitter.getBehaviorByName("Fire") as FireBehavior;
                            fireBehavior.extinguish();
                        }
                        obs.remove();
                        GUIWindows.createFailureScreen(scene, () => {
                            interactionManager.currentInteractionHandler.dispose();
                            initScene(scene);
                        });                    
                    }    
                });

                break;
            case Status.RESET:
                finalGameState.notifyObservers(Status.RESET);
                // Reset the scene. Ideally, we could do this without reloading the page, for performance.
                break;
        }
    });        
}

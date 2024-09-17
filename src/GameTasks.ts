import { Scene } from "@babylonjs/core/scene";
import { Task } from "./Task";
import { ListItem } from "./UpdateClipboardBehavior";
import { PouringBehavior } from "./PouringBehavior";
import { log } from "./utils";
import { Status } from "./Task";
import { startFire } from "./startFire";
import { FireBehavior } from "./FireBehavior";
import { GUIWindows } from "./GUIManager";
import { enablePointerLock, resetScene } from "./scene";
import { global } from "./GlobalState";
import { setColor } from "./createCylinder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Observable } from "@babylonjs/core";

interface ITaskMap {
    [key: string]: Task
}

export const finalGameState: Observable<Status> = new Observable();

let isFire = false;

export const setupTasks = (scene: Scene, listItems: ListItem[], cylinders: Array<string>) => {
    const fire = startFire(scene);

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
                    resetScene(scene)
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
                const emitter = scene.getMeshById("emitter");
                console.log(emitter);
                let fireBehavior = emitter.getBehaviorByName("Fire") as FireBehavior;
                console.log(fireBehavior);
                fireBehavior.onFireObservable.notifyObservers(true);
                isFire = true;
                finalGameState.notifyObservers(Status.FAILURE);
                
                if (isFire) {
                    fireBehavior.onFireObservable.add((state) => {
                        if (!state) {
                            isFire = false;
                            GUIWindows.createFailureScreen(scene, () => {
                                resetScene(scene);
                            })
                        }
                    })
                }
                break;
            case Status.RESET:
                finalGameState.notifyObservers(Status.RESET);
                // Reset the scene. Ideally, we could do this without reloading the page, for performance.
                break;
        }
    });        
}

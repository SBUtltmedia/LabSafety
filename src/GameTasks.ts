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

export const setupTasks = (scene: Scene, listItems: ListItem[]) => {
    let taskList: Task[] = [];

    let pouringTasks: Task[] = [];
    let taskMap: ITaskMap = {};

    listItems.forEach(item => {
        if (item.logic) {
            if (item.logic.taskType === "pouring") {
                setupPouringTask(scene, item, taskList, pouringTasks, taskMap);
            }
        }
    })

    setupSOP(scene, pouringTasks);

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

const processTask = (targetName: string, toName: string, task: Task, scene: Scene) => {
    if (targetName === toName) {
        task.succeed();
    } else {
        task.fail();
    }
}

const setupPouringTask = (scene: Scene, item: ListItem, taskList: Task[], pouringTasks: Task[], taskMap: ITaskMap) => {
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

    let fromMesh = scene.getMeshByName(logic.from);
    let pouringBehavior = fromMesh.getBehaviorByName("Pouring") as PouringBehavior;

    pouringBehavior.onMidPourObservable.add(target => {
        log(`Pouring mesh name: ${pouringBehavior.mesh.name}`);
        log(`Poured mesh name: ${target.name}`);

        const targetColor = (target.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid").material as StandardMaterial).diffuseColor;
        const sourceColor = (pouringBehavior.mesh.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid").material as StandardMaterial).diffuseColor;

        const mixedColor = new Color3((targetColor.r + sourceColor.r) / 2, (targetColor.g + sourceColor.g) / 2, (targetColor.b + sourceColor.b) / 2);

        setColor(target, mixedColor);

        if (pouringBehavior.animating) {
            pouringBehavior.onAnimationChangeObservable.addOnce(() => {
                processTask(target.name, logic.to, task, scene);
            })
        } else {
            processTask(target.name, logic.to, task, scene);
        }        
    })

}

const setupSOP = (scene: Scene, pouringTasks: Task[]) => {
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
                const fire = startFire();
                const fireBehavior = fire.getBehaviorByName("Fire") as FireBehavior;
                if (fireBehavior) {
                    fireBehavior.onFireObservable.add(aflame => {
                        if (!aflame) {
                            // Handle successful fire handling: show failure screen, play fanfare.
                            GUIWindows.createFailureScreen(scene, () => {
                                enablePointerLock();
                                resetScene(scene)
                            });
                            // TODO: find a new sound for SOP failure.
                            // global.sounds.success.stop();
                            // global.sounds.success.play();
                        }
                    });
                }
                finalGameState.notifyObservers(Status.FAILURE);
                break;
            case Status.RESET:
                finalGameState.notifyObservers(Status.RESET);
                // Reset the scene. Ideally, we could do this without reloading the page, for performance.
                break;
        }
    });        
}


import { Scene } from "@babylonjs/core/scene";
import { Task } from "./Task";
import { ListItem } from "./UpdateClipboardBehavior";
import { PouringBehavior } from "./PouringBehavior";
import { log } from "./utils";
import { Status } from "./Task";
import { startFire } from "./startFire";
import { FireBehavior } from "./FireBehavior";
import { GUIWindows } from "./GUIManager";
import { Sound } from "@babylonjs/core/Audio/sound";
import { COMPLETION_SOUND_PATH, FAIL_SOUND_PATH, SUCCESS_SOUND_PATH } from "./Constants";
import { resetScene } from "./scene";
import { global } from "./GlobalState";
import { setColor } from "./createCylinder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";

interface ITaskMap {
    [key: string]: Task
}

interface ISounds {
    ding: Sound;
    explosion: Sound;
    fanfare: Sound;
}

export const setupTasks = (scene: Scene, listItems: ListItem[]) => {

    let taskList: Task[] = [];

    let pouringTasks: Task[] = [];
    let taskMap: ITaskMap = {};

    const sounds = {
        ding: new Sound("ding", SUCCESS_SOUND_PATH),
        explosion: new Sound("explosion", FAIL_SOUND_PATH),
        fanfare: new Sound("fanfare", COMPLETION_SOUND_PATH)
    };         

    listItems.forEach(item => {
        if (item.logic) {
            if (item.logic.taskType === "pouring") {
                setupPouringTask(scene, item, taskList, pouringTasks, taskMap);
            }
        }
    })

    setupSOP(scene, pouringTasks, sounds);

    taskList.forEach(task => {
        task.onTaskStateChangeObservable.add(status => {
            if (status === Status.SUCCESSFUL) {
                // Play ding
                if (!sounds.fanfare.isPlaying && !sounds.explosion.isPlaying) {
                    log("Playing ding");
                    sounds.ding.stop();
                    sounds.ding.play();
                }
            }
        });            
    })

    global.taskList = taskList;
}

const processTask = (targetName: string, toName: string, task: Task) => {
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

    pouringBehavior.onAfterPourObservable.add(target => {
        log(`Pouring mesh name: ${pouringBehavior.mesh.name}`);
        log(`Poured mesh name: ${target.name}`);

        const targetColor = (target.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid").material as StandardMaterial).diffuseColor;
        const sourceColor = (pouringBehavior.mesh.getChildMeshes().find(childMesh => childMesh.id.split("-").pop() === "liquid").material as StandardMaterial).diffuseColor;

        const mixedColor = new Color3((targetColor.r + sourceColor.r) / 2, (targetColor.g + sourceColor.g) / 2, (targetColor.b + sourceColor.b) / 2);

        setColor(target, mixedColor);

        if (pouringBehavior.animating) {
            pouringBehavior.onAnimationChangeObservable.addOnce(() => {
                processTask(target.name, logic.to, task);
            })
        } else {
            processTask(target.name, logic.to, task);
        }
    })

}

const setupSOP = (scene: Scene, pouringTasks: Task[], sounds: ISounds) => {
    global.sop = new Task("SOP", "Standard operating procedure for lab safety.", [pouringTasks]);

    global.sop.onTaskStateChangeObservable.add(status => {
        switch (status) {
            case Status.SUCCESSFUL:
                // Show success screen, play fanfare.
                GUIWindows.createSuccessScreen(scene, () => resetScene(scene));
                sounds.fanfare.stop();
                sounds.fanfare.play();
                break;
            case Status.FAILURE:
                // Play explosion, start a fire.
                log("Fail SOP");
                sounds.explosion.stop();
                sounds.explosion.play();
                const fire = startFire();
                const fireBehavior = fire.getBehaviorByName(FireBehavior.name) as FireBehavior;
                if (fireBehavior) {
                    fireBehavior.onFireObservable.add(aflame => {
                        if (!aflame) {
                            // Handle successful fire handling: show failure screen, play fanfare.
                            GUIWindows.createFailureScreen(scene, () => resetScene(scene));
                            // @todo: find a new sound for SOP failure.
                            sounds.fanfare.stop();
                            sounds.fanfare.play();
                        }
                    });
                }
                break;
            case Status.RESET:
                // Reset the scene. Ideally, we could do this without reloading the page, for performance.
                break;
        }
    });        
}


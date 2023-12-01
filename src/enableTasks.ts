import { Engine, Scene, Sound } from "@babylonjs/core";
import { PouringBehavior } from "./PouringBehavior";
import { COMPLETION_SOUND_PATH, FAIL_SOUND_PATH, SUCCESS_SOUND_PATH } from "./Constants";
import { bToCTask, cToATask, sop } from "./SOP";
import { Status } from "./Task";
import { log } from "./utils";

export function enableTasks(scene: Scene): void {
    const pourers = scene.meshes.filter(mesh => {
        return Boolean(mesh.behaviors.find(behavior => behavior.name === PouringBehavior.name));
    });

    const pouringBehaviors = pourers.map(pourer => pourer.getBehaviorByName(PouringBehavior.name) as PouringBehavior);

    const sounds = {
        ding: new Sound("ding", SUCCESS_SOUND_PATH),
        explosion: new Sound("explosion", FAIL_SOUND_PATH),
        fanfare: new Sound("fanfare", COMPLETION_SOUND_PATH)
    };

    [bToCTask, cToATask].forEach(task => {
        task.onTaskStateChangeObservable.add(status => {
            if (status === Status.SUCCESSFUL) {
                // Play ding
                if (!sounds.fanfare.isPlaying && !sounds.explosion.isPlaying) {
                    sounds.ding.stop();
                    sounds.ding.play();
                }
            }
        });
    });

    sop.onTaskStateChangeObservable.add(status => {
        switch (status) {
            case Status.SUCCESSFUL:
                sounds.fanfare.stop();
                sounds.fanfare.play();
                // Play fanfare, fade to black. After a few seconds, reset.
                break;
            case Status.FAILURE:
                sounds.explosion.stop();
                sounds.explosion.play();
                // Play explosion, cut to black screen. After a few seconds, reset.
                break;
            case Status.RESET:
                // Reset the scene. Ideally, we could do this without reloading the page, for performance.
                break;
        }
    });

    pouringBehaviors.forEach(b => {
        b.onMidPourObservable.add(target => {
            log(`Pouring mesh name: ${b.mesh.name}`);
            log(`Poured mesh name: ${target.name}`);
            if (b.mesh.name === "cylinder-b") {
                if (target.name === "cylinder-c") {
                    bToCTask.succeed();
                } else {
                    bToCTask.fail();
                }
            } else if (b.mesh.name === "cylinder-c") {
                if (target.name === "cylinder-a") {
                    // Poured C into A. If this was done out of order, it will fail the SOP.
                    cToATask.succeed();
                } else {
                    cToATask.fail();
                }
            } else {
                sop.fail();
            }
        });
    });
}

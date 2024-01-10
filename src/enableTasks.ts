import { Scene } from "@babylonjs/core/scene";
import { Sound } from "@babylonjs/core/Audio/sound";

import { COMPLETION_SOUND_PATH, FAIL_SOUND_PATH, SUCCESS_SOUND_PATH } from "./Constants";
import { PouringBehavior } from "./PouringBehavior";
import { bToCTask, cToATask, sop } from "./SOP";
import { Status } from "./Task";
import { log } from "./utils";
import { startFire } from "./startFire";
import { FireBehavior } from "./FireBehavior";
import { GUIWindows } from "./GUIManager";

// TODO: is it fine to use global variable here?
import { resetScene, xrExperience } from "./scene";

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
                // Show success screen, play fanfare.
                GUIWindows.createSuccessScreen(scene, xrExperience, () => resetScene(scene));
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
                            GUIWindows.createFailureScreen(scene, xrExperience, () => resetScene(scene));
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

    pouringBehaviors.forEach(b => {
        b.onMidPourObservable.add(target => {
            log(`Pouring mesh name: ${b.mesh.name}`);
            log(`Poured mesh name: ${target.name}`);
            if (b.mesh.name === "cylinder-b") {
                if (target.name === "cylinder-c") {
                    // Poured B into C. If this was done out of order, it will fail the SOP.
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

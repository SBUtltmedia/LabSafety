import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { SOP_TEMPLATE_PATH } from "./Constants";
import { FadeRespawnBehavior } from "./FadeRespawnBehavior";
import { setupTasks } from "./GameTasks";
import { global } from "./GlobalState";
import { InteractableBehavior } from "./interactableBehavior";
import { GrabState, InteractionMode } from "./interactionManager";
import { interactionManager } from "./scene";
import { stateMachine } from "./setupGameStates";
import { GameStates } from "./StateMachine";
import { ListItem, UpdateClipboardBehavior } from "./UpdateClipboardBehavior";

export function createClipboard(mesh: AbstractMesh): void {
    const scene = mesh.getScene();

    const material = new StandardMaterial("clipboard-material", scene);
    material.emissiveColor.copyFrom(Color3.White());
    material.useAlphaFromDiffuseTexture = true;
        
    const plane = mesh.getChildMeshes().find(childMesh => childMesh.name === `${mesh.id}-plane`);
    plane.material = material;

    fetch(SOP_TEMPLATE_PATH)
    .then(r => r.text())
    .then(text => {
        fetch("./json/sopData.json")
        .then(r => r.json())
        .then(json => {
            let listItems: ListItem[] = json.items[1].sublist;

            setupTasks(scene, listItems);

            const updateClipboardBehavior = new UpdateClipboardBehavior(text, json, global.sop, global.taskList);
            plane.addBehavior(updateClipboardBehavior);
        });
    });
    
    // @todo: Make the clipboard more readable out of XR
    const interactableBehavior = new InteractableBehavior(interactionManager, {
        defaultRotation: new Vector3(Math.PI, Math.PI / 2, Math.PI / 2),
        modeDefaults: {
            [InteractionMode.DESKTOP]: {
                defaultPosition: new Vector3(0, 0, -0.5)
            },
            [InteractionMode.MOBILE]: {
                defaultPosition: new Vector3(0, 0, -0.5)
            }
        }
    });

    interactableBehavior.onGrabStateChangedObservable.add(({ anchor, grabber, state }) => {
        if (state === GrabState.GRAB) {
            stateMachine.onStateChangeObervable.notifyObservers(GameStates.GAME_STATE_PICK_SOP);
        } else {
            stateMachine.onStateChangeObervable.notifyObservers(GameStates.GAME_STATE_DROP_SOP);
        }
    });

    if (plane instanceof Mesh) {
        interactableBehavior.interactionManager.highlightLayer.addExcludedMesh(plane);
    }

    const fadeRespawnBehavior = new FadeRespawnBehavior();
    
    mesh.addBehavior(interactableBehavior);
    mesh.addBehavior(fadeRespawnBehavior);
}
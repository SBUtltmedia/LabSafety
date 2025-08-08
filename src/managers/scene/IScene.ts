import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { InteractionManager } from "../interactions/interactionManager";

export interface IScene {
    name: string;
    createScene(engine: Engine, interactionManager: InteractionManager, xrExperience: WebXRDefaultExperience): Promise<Scene>;
    // Add any other methods or properties your scenes will need.
}
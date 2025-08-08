import { Observable } from "@babylonjs/core/Misc/observable";
import { IScene } from "./IScene";

export interface ISceneMessage {
    scene: IScene;
    action: 'load' | 'replace' | 'dispose';
}

export const sceneActionDispatcher = new Observable<ISceneMessage>();
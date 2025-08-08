import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";

import { log } from "../../utils";
import { InteractionManager } from "../interactions/interactionManager";
import { configureCamera } from "../../entities/camera";
import { XR_OPTIONS, configureXR } from "../interactions/xr";
import { IScene } from "./IScene";
import { setUpEngine } from "../../systems/setUpEngine";
import { sceneActionDispatcher, ISceneMessage } from "./sceneEvents";
import { Observable } from "@babylonjs/core";

export let sceneLoadedObservable = new Observable();

export class SceneManager {
    private _engine: Engine;
    private _canvas: HTMLCanvasElement;
    private _currentScene: Scene | null = null;
    private _utilityLayer: UtilityLayerRenderer | null = null;
    public interactionManager: InteractionManager | null = null;
    public xrExperience: WebXRDefaultExperience | null = null;
    private meshesToPreserveNames: string[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        this._engine = new Engine(this._canvas, true);
        setUpEngine(this._engine);
        window.addEventListener("resize", () => {
            this._engine.resize();
        });

        sceneActionDispatcher.add((message: ISceneMessage) => {
            switch (message.action) {
                case 'load':
                case 'replace':
                    this.loadScene(message.scene);
                    break;
                case 'dispose':
                    this.disposeScene();
                    break;
            }
        });        
    }

    public async loadScene(sceneToLoad: IScene): Promise<void> {
        log(`Loading scene: ${sceneToLoad.name}`);

        if (this._currentScene) {
            this._currentScene.dispose();
            this.meshesToPreserveNames = [];
        }

        this._currentScene = new Scene(this._engine);
        this._currentScene.collisionsEnabled = true;

        this._setupCommonSceneElements(this._currentScene);

        if ("xr" in window.navigator) {
            this.xrExperience = await this._currentScene.createDefaultXRExperienceAsync(XR_OPTIONS);
            this.interactionManager = new InteractionManager(this._currentScene, this.xrExperience);

            await configureXR(this.xrExperience, this.interactionManager, this.meshesToPreserveNames);  
            this._setupXRPreservedMeshes(this._currentScene);
        } else {
            this.interactionManager = new InteractionManager(this._currentScene);
        }

        await sceneToLoad.createScene(this._engine, this.interactionManager, this.xrExperience);
        
        this._currentScene.executeWhenReady(() => {
            sceneLoadedObservable.notifyObservers(true);
            this._engine.runRenderLoop(() => {
                if (this._currentScene) {
                    this._currentScene.render();
                }
            });
        });
    }

    public disposeScene(): void {
        if (this._currentScene) {
            log("Disposing current scene");
            this._engine.stopRenderLoop();
            this._currentScene.dispose();
            this._currentScene = null;
            this.interactionManager = null;
            this.xrExperience = null;
            this.meshesToPreserveNames = [];
        }
    }
    
    private _setupCommonSceneElements(scene: Scene): void {
        const light = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        light.intensity = 1;

        const camera = new UniversalCamera("camera", new Vector3(0, 0.1, -1), scene);
        configureCamera(camera);
        scene.activeCamera = camera;
        scene.activeCamera.attachControl(this._canvas, true);

        this._utilityLayer = new UtilityLayerRenderer(scene);
    }

    private _setupXRPreservedMeshes(scene: Scene): void {
        this.meshesToPreserveNames.push(...scene.meshes.map(mesh => mesh.name));
        if (this.xrExperience) {
            for (const controller of this.xrExperience.input.controllers) {
                this.meshesToPreserveNames.push(controller.pointer.name);
                if (controller.grip) {
                    this.meshesToPreserveNames.push(controller.grip.name);
                }
            }
            this.xrExperience.input.onControllerAddedObservable.add(controller => {
                this.meshesToPreserveNames.push(controller.pointer.name);
                if (controller.grip) this.meshesToPreserveNames.push(controller.grip.name);
            });
            this.xrExperience.input.onControllerRemovedObservable.add(controller => {
                let index = this.meshesToPreserveNames.findIndex(name => name === controller.pointer.name);
                if (index !== -1) this.meshesToPreserveNames.splice(index, 1);
                if (controller.grip) {
                    index = this.meshesToPreserveNames.findIndex(name => name === controller.grip.name);
                    if (index !== -1) this.meshesToPreserveNames.splice(index, 1);
                }
            });
        }
    }

    public get currentScene(): Scene | null {
        return this._currentScene;
    }

    public get engine(): Engine {
        return this._engine;
    }
}
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene, ParticleHelper, Vector3, StandardMaterial, Color3 } from "@babylonjs/core";
import { FireBehavior } from "./FireBehavior";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Ellipse } from "@babylonjs/gui";

interface IHotspotMap {
    [key: string]: Ellipse
};

export let HotspotEllipseMap: IHotspotMap = {};
export const DEFAULT_BG = "#FF0000";
export const HIT_BG = "#00FF00";

export const createGUIElement = (mesh: Mesh) => {
    let adt = AdvancedDynamicTexture.CreateForMesh(mesh);
    let c1 = new Ellipse();

    c1.width = "100%"
    c1.height = "100%";
    c1.color = "Orange";
    c1.thickness = 40;
    c1.background = DEFAULT_BG;
    c1.alpha = 0.9;

    HotspotEllipseMap[mesh.name] = c1;

    adt.addControl(c1);
}

export const createHotspot = (name: string, pos: Vector3, scene: Scene) => {
    let hotspot1 = MeshBuilder.CreatePlane(name, {size: 0.25});
    hotspot1.parent = scene.getMeshById("ExitDoor");
    hotspot1.isVisible = false;
    hotspot1.position = pos;
    hotspot1.rotation = new Vector3(0, Math.PI / 2, 0);

    return hotspot1;
}

export function setupFires(scene: Scene): Mesh[] {
    let emitters = [];

    emitters.push(MeshBuilder.CreateBox("emitter1", {size: 0.5}));
    emitters.push(MeshBuilder.CreateBox("emitter2", {size: 0.5}));
    emitters.push(MeshBuilder.CreateBox("emitter3", {size: 0.5}));

    for (let emitter of emitters) {
        emitter.parent = scene.getMeshById("ExitDoor");    
    }

    emitters[0].position.copyFromFloats(0,0,0);
    emitters[1].position.copyFromFloats(0,0,2.5);
    emitters[2].position.copyFromFloats(-2,0,4);

    let hotspot1 = createHotspot("hotspot1", new Vector3(-0.1, -0.5, -0.8), scene);
    let hotspot2 = createHotspot("hotspot2", new Vector3(-0.1, -0.5, -0.2), scene);
    let hotspot3 = createHotspot("hotspot3", new Vector3(-0.1, -0.5, 0.4), scene);
    
    createGUIElement(hotspot1);
    createGUIElement(hotspot2);
    createGUIElement(hotspot3);


    for (let emitter of emitters) {
        ParticleHelper.CreateAsync("fire", scene).then((set) => {
            emitter.isVisible=false
            // emitter.position= new Vector3(-4,3,-1.6)
            const fireBehavior = new FireBehavior();
            emitter.addBehavior(fireBehavior);        
            set.emitterNode=emitter;

            fireBehavior.onFireObservable.add((isRunning) => {
                if (!isRunning) {
                    set.dispose();
                } else {
                    set.start();
                }
            })
        });
    }

    return emitters;
}
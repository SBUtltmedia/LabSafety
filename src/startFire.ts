import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene, ParticleHelper, Vector3 } from "@babylonjs/core";
import { FireBehavior } from "./FireBehavior";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Ellipse } from "@babylonjs/gui";

export const createGUIElement = (mesh: Mesh) => {
    let adt = AdvancedDynamicTexture.CreateForMesh(mesh);
    let c1 = new Ellipse();

    c1.width = 2;
    c1.height = 2;
    c1.color = "black";
    c1.background = "blue";
    c1.thickness = 2;
    c1.alpha = 0.40;

    adt.addControl(c1);
}

export function setupFires(scene: Scene): Mesh[] {
    let emitters = [];

    emitters.push(MeshBuilder.CreateBox("emitter1", {size: 0.5}));
    emitters.push(MeshBuilder.CreateBox("emitter2", {size: 0.5}));
    emitters.push(MeshBuilder.CreateBox("emitter3", {size: 0.5}));
    emitters.push(MeshBuilder.CreateBox("emitter4", {size: 0.5}));

    for (let emitter of emitters) {
        emitter.parent = scene.getMeshById("ExitDoor");    
    }

    emitters[0].position.copyFromFloats(0,0,0);
    emitters[1].position.copyFromFloats(0,0,2.5);
    emitters[2].position.copyFromFloats(-2,0,4);
    emitters[3].position.copyFromFloats(-4,0,4);

    let hotspot1 = MeshBuilder.CreateSphere("hotspot1", {diameter: 0.35});
    hotspot1.parent = scene.getMeshById("ExitDoor");
    hotspot1.isVisible = false;
    hotspot1.position = new Vector3(0, 0, -0.8);

    let hotspot2 = MeshBuilder.CreateSphere("hotspot2", {diameter: 0.35});
    hotspot2.parent = scene.getMeshById("ExitDoor");
    hotspot2.isVisible = false;
    hotspot2.position = new Vector3(0, 0, -0.2);

    let hotspot3 = MeshBuilder.CreateSphere("hotspot3", {diameter: 0.35});
    hotspot3.parent = scene.getMeshById("ExitDoor");
    hotspot3.isVisible = false;
    hotspot3.position = new Vector3(0, 0, 0.4);    
    
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
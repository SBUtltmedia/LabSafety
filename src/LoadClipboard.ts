
// import FlyToCameraBehavior from "./FlyToCameraBehavior";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";

/**
 * 
 * @param clipboard The total clipboard mesh
 * @param xrCamera Camera used 
 */

export function createClipboard(clipboard: Mesh) {
    clipboard.name = 'clipboard';
    const scene: Scene = clipboard.getScene();
    const table: AbstractMesh = scene.getMeshByName('Table')!;
    if (table) {
        const tableBoundingBox = table.getBoundingInfo().boundingBox;
        clipboard.position.y = tableBoundingBox.maximumWorld.y + 0.003;
    }
    clipboard.rotationQuaternion = null;
    clipboard.rotation = new Vector3(0, Math.PI / 4, 0);
    const cylinderA = scene.getMeshByName('pivot-Cylinder-A');
    if (cylinderA) {
        clipboard.position.x = cylinderA.position.x + 0.2;
        clipboard.position.z = cylinderA.position.z + 0.5;
    }
    // fetch(`${rootPath}images/sop42.svg`)
    //     .then(r => r.text())
    //     .then(text => {
    //         let svgFrag = fragmentFromString(text); // returns DOM object
    //         let procedureEL = svgFrag.getElementById("procedure-list")!;
    //         let newOL = document.createElement("ol");
    //         let newLI = document.createElement("li");
    //         newLI.innerHTML = "Heyyo";
    //         newOL.append(newLI);
    //         procedureEL.innerHTML = "";
    //         procedureEL.append(newOL);
    //         const serializer = new XMLSerializer();
    //         const document_fragment_string = serializer.serializeToString(svgFrag);
    //         domToMaterial(document_fragment_string);
    //     }).catch(console.error.bind(console));
    //flyToCamera.clipboardClick();
}
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Texture, StandardMaterial, Color3 } from "@babylonjs/core";
import { rootPath } from "./Constants";
import { getChildMeshByName } from "./utils";
import Handlebars from "handlebars";
import data from './sopData.json';

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

    function fragmentFromString(stringHTML: string) {

        console.log("data: ", data);

        let temp = document.createElement('template');
        temp.innerHTML = stringHTML;
        var template = Handlebars.compile(temp.innerHTML);
        var html = template(data);
        temp.innerHTML = html;
        return temp.content
    }

    function domToMaterial(text: string) {


        const svg = text;
        const buffer = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

        const texture = Texture.LoadFromDataString("tex", buffer, scene, undefined, undefined, undefined, Texture.LINEAR_LINEAR_MIPNEAREST);
        // const texture = Texture.LoadFromDataString("tex", buffer, scene);
        // texture.samplingMode = Texture.NEAREST_SAMPLINGMODE;
        let material = new StandardMaterial("mat", scene);

        material.diffuseTexture = texture;
        texture.uScale = 1.0;
        texture.vScale = -1.0;

        material.emissiveColor = Color3.White();
        material.useAlphaFromDiffuseTexture = true;
        texture.hasAlpha = true;
        let planeText = getChildMeshByName(clipboard, "Plane");
        planeText.material = material;
        console.log("Material set")
    }

    fetch(`${rootPath}images/sopTemplate.svg`)
        .then(r => r.text())
        .then(text => {
            console.log("fetched!")
            let svgFrag = fragmentFromString(text); // returns DOM object
            // console.log(svgFrag);
            let procedureEL = svgFrag.getElementById("procedure-list")!;
            console.log(procedureEL)
            // let newOL = document.createElement("ol");
            // let newLI = document.createElement("li");
            // // newLI.innerHTML = "Heyyo";
            // newOL.append(newLI);
            // procedureEL.innerHTML = "";
            // procedureEL.append(newOL);
            const serializer = new XMLSerializer();
            const document_fragment_string = serializer.serializeToString(svgFrag);
            domToMaterial(document_fragment_string);
        }).catch(console.error.bind(console));
    //flyToCamera.clipboardClick();
}
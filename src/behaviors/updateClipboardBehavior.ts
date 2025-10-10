import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Observer } from "@babylonjs/core/Misc/observable";

import Handlebars from "handlebars";

import { Status, Task } from "../systems/task";
import { Nullable } from "@babylonjs/core/types";

const indicatorClassMap = {
    [Status.SUCCESSFUL]: "correct",
    [Status.FAILURE]: "incorrect",
    [Status.RESET]: "empty"
};

interface ILogic {
    taskType: string,
    subtasks: string[],
    [otherOptions: string]: any
}

export interface ListItem {
    taskName: string;
    indicator?: string;
    logic?: ILogic;
    text: string;
}

export class UpdateClipboardBehavior implements Behavior<AbstractMesh> {
    templateString: string;
    // @todo: Define the shape of the data.
    data: any;
    basicTasks: Task[];
    rootTask: Task;
    #taskObservers: Observer<Status>[];
    mesh: AbstractMesh;
    #delegate: HandlebarsTemplateDelegate<any>;
    #counter: number;
    
    constructor(templateString: string, data: any, rootTask: Task, basicTasks: Task[]) {
        this.templateString = templateString;
        this.#delegate = Handlebars.compile(this.templateString);
        this.data = data;
        this.rootTask = rootTask;
        this.basicTasks = basicTasks;
        this.#taskObservers = [];
        this.#counter = 0;
    }

    get name() {
        return "UpdateClipboard";
    }

    init() {

    }

    #getListItemByName = (taskName: string): Nullable<ListItem> => {
        return this.#listItems.find((item: ListItem) => item.taskName === taskName) || null;
    }

    get #listItems(): ListItem[] {
        return this.data.items[1].sublist;
    }

    attach = (mesh: AbstractMesh) => {
        this.mesh = mesh;

        this.#updateTextureFromData();

        this.#taskObservers.push(
            ...this.basicTasks.map(task => {
                return task.onTaskStateChangeObservable.add(status => {
                    // If the task succeeded, update the data to have
                    // a checkbox for this task. If the task failed, update
                    // the data to have an X for this task. If the task was
                    // reset, update the data to be blank for this task.
                    // log("task name: ", task.name);
                    const item = this.#getListItemByName(task.name)!;
                    item.indicator = indicatorClassMap[status];
                    this.#updateTextureFromData();
                })
            })
        );
        this.#taskObservers.push(
            this.rootTask.onTaskStateChangeObservable.add(status => {
            // I'm not sure anything needs to happen here.
            // I'll leave it here for now.
            })
        );
    }

    detach = () => {
        for (let observer of this.#taskObservers) {
            observer.remove();
        }
    }

    #updateTextureFromData = (): void => {
        // Get DocumentFragment from the SVG template string and JSON data
        const templateElement = document.createElement("template");
        const html = this.#delegate(this.data);
        templateElement.innerHTML = html;

        // Serialize the DocumentFragment to a string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(templateElement.content);

        // Load the string into a buffer to generate the texture
        const buffer = "data:image/svg+xml;utf8," + encodeURIComponent(svgString);
        const texture = Texture.LoadFromDataString(`clipboard-texture-${this.#counter++}`, buffer, this.mesh.getScene(), undefined, undefined, undefined, Texture.LINEAR_LINEAR_MIPNEAREST, () => {
            texture.uScale = 1.0;
            texture.vScale = -1.0;
            texture.hasAlpha = true;

            this.#updateTexture(texture);
        });
    }

    #updateTexture = (texture: Texture): void => {
        const material = this.mesh.material as StandardMaterial;
        if (material.diffuseTexture === texture) {
            return;
        }
        if (material.diffuseTexture) {
            // Release old texture.
            material.diffuseTexture.dispose();
        }
        material.diffuseTexture = texture;
    }
}
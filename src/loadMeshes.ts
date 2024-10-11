import { ISceneLoaderAsyncResult, SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

export const modelNames = ["rg", "placard", "cylinder", "clipboardc", "fire-extinguisherc"];

export let meshMap = {};

modelNames.forEach(modelName => {
    meshMap[modelName] = modelName
})

meshMap = {...meshMap, "FireCabinet": "FireCabinet", "Glass Divider": "Glass Divider", "room": "rg", "clipboard": "clipboardc", "fire-extinguisher": "fire-extinguisherc"};


export function loadMeshes(names: string[] = modelNames): Promise<ISceneLoaderAsyncResult[]> {
    // NOTE: I renamed the .glb files in /public/models to have friendlier names (equal to <name>.glb for <name> in modelsToLoad). This greatly cleans up the code here.
    return Promise.all(names.map(name => {
        return SceneLoader.ImportMeshAsync("", "./models/", `${name}.glb`).then(result => {
            const rootMesh = result.meshes.find(mesh => mesh.id === "__root__")!;  // Should be guaranteed
            rootMesh.id = name;
            rootMesh.name = name;
            return result;
        })
    }));
}
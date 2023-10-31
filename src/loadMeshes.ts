import { ISceneLoaderAsyncResult, SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

export const modelNames = ["room", "placard", "cylinder", "clipboard", "fire-extinguisher"];

export function loadMeshes(names: string[] = modelNames): Promise<ISceneLoaderAsyncResult[]> {
    // NOTE: I renamed the .glb files in /public/models to have friendlier names (equal to <name>.glb for <name> in modelsToLoad). This greatly cleans up the code here.
    return Promise.all(names.map(name => {
        return SceneLoader.ImportMeshAsync("", "/models/", `${name}.glb`).then(result => {
            const rootMesh = result.meshes.find(mesh => mesh.id === "__root__")!;  // Should be guaranteed
            rootMesh.id = name;
            rootMesh.name = name;
            return result;
        })
    }));
}

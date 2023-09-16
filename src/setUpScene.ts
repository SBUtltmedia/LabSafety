import { Scene } from "@babylonjs/core/scene";

export function setUpScene(scene: Scene, debug: boolean = false) {
    scene.collisionsEnabled = true;

    if (debug && import.meta.env.DEV) {
        import("@babylonjs/inspector").then(({ Inspector }) => {
            Inspector.Show(scene, {
                showInspector: false,
                showExplorer: false
            });
        });
    }
}

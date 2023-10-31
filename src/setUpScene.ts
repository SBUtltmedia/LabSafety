import { Scene } from "@babylonjs/core/scene";

export function setUpScene(scene: Scene, debug: boolean = false) {
    scene.collisionsEnabled = true;

    if (debug && import.meta.env.DEV) {
        import("@babylonjs/inspector").then(({ Inspector }) => {
            Inspector.Hide();
            window.addEventListener("keydown", (ev) => {
                // Shift+Ctrl+Alt+I
                if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                    if (Inspector.IsVisible) {
                        Inspector.Hide();
                    } else {
                        Inspector.Show(scene, {});
                    }
                }
            });
        });
    }
}

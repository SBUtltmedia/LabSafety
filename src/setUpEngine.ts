import { Engine } from "@babylonjs/core/Engines/engine";

export function setUpEngine(engine: Engine): void {
    window.addEventListener("resize", function () {
        engine.resize();
    });
}

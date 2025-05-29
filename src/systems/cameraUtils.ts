import { Scene } from "@babylonjs/core/scene";
import { UniversalCamera } from "@babylonjs/core/Cameras";

export class CameraRotator {
    private scene: Scene;
    private camera: UniversalCamera;
    private canvas: HTMLCanvasElement;
    private readonly borderThreshold = 10;
    private readonly rotationDelta = 0.025;

    constructor(scene: Scene, camera: UniversalCamera, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.camera = camera;
        this.canvas = canvas;
    }

    public rotateCameraOnEdge(): void {
        const pointerX = this.scene.pointerX;
        const pointerY = this.scene.pointerY;

        const atLeftBorder = pointerX <= this.borderThreshold;
        const atRightBorder = pointerX >= this.canvas.width - this.borderThreshold;
        const atTopBorder = pointerY <= this.borderThreshold;
        const atBottomBorder = pointerY >= this.canvas.height - this.borderThreshold;

        if (atLeftBorder) {
            this.camera.rotation.y -= this.rotationDelta;
        } else if (atRightBorder) {
            this.camera.rotation.y += this.rotationDelta;
        } else if (atTopBorder) {
            this.camera.rotation.x -= this.rotationDelta;
        } else if (atBottomBorder) {
            this.camera.rotation.x += this.rotationDelta;
        }
    }
}
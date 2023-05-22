import { AdvancedDynamicTexture, Rectangle, TextBlock, 
         Button, GUI3DManager, PlanePanel } from "@babylonjs/gui"
import { Camera, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core"

class PromptWithButton {
    promptText: string;
    buttonText: string;
    textColor: string;
    fontSize: number;
    textPos: Vector3;
    buttonPos: Vector3;
    buttonSize: Vector3;
  
    constructor(
      promptText: string,
      buttonText: string,
      textColor: string,
      fontSize: number,
      textPos: Vector3,
      buttonPos: Vector3,
      buttonSize: Vector3
    ) {
      this.promptText = promptText;
      this.buttonText = buttonText;
      this.textColor = textColor;
      this.fontSize = fontSize;
      this.textPos = textPos;
      this.buttonPos = buttonPos;
      this.buttonSize = buttonSize;
    }
  
    
  
  }
  



export class GUIManager {
    advancedTexture: AdvancedDynamicTexture;
    welcomePrompt: PromptWithButton;
    gameFinishPrompt: PromptWithButton;
    camera: Camera;
    screen: Mesh;
    manager: GUI3DManager;
    scene: Scene;
    panel: PlanePanel;

    constructor(scene: Scene) {
        this.camera = scene.activeCamera;
        this.screen = MeshBuilder.CreatePlane("Start", { size: .5 });
        this.screen.parent = this.camera;

        this.scene = scene;
        this.manager = new GUI3DManager(this.scene);
        this.panel = new PlanePanel();
        this.panel.margin = 0.2;
        this.panel.position.z = -0.5;
    }

}

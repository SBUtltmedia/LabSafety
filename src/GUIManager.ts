import { AdvancedDynamicTexture, Rectangle, TextBlock, Button, Container } from "@babylonjs/gui"
import { Camera, Mesh, MeshBuilder, Scene, Vector3, WebXRState } from "@babylonjs/core"
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience.js";


class PromptWithButton {
    rect: Rectangle;
    text: TextBlock;
    button: Button;

    constructor(rect: Rectangle, text: TextBlock, button: Button) {
        this.rect = rect;
        this.text = text;
        this.button = button;
    }

    setVisible(visible = true) {
        this.rect.isVisible = visible;
        this.text.isVisible = visible;
        this.button.isVisible = visible;
    }
}

export class GUIManager {
    advancedTexture: AdvancedDynamicTexture;
    welcomePrompt: PromptWithButton;
    gameFinishPrompt: PromptWithButton;
    camera: Camera;
    screen: Mesh;
    scene: Scene;

    containers: any;

    constructor(scene: Scene) {
      this.scene = scene;
      this.camera = scene.activeCamera;
      this.containers = {};
    }

    createPromptWithButtonVR(text: string, xrCamera: WebXRDefaultExperience = null, buttonClickCallBack = null, ...args) {

      let meshes = this.scene.getMeshByName("Start");

      while (meshes != null && meshes != undefined) {
        meshes.dispose();
        meshes = this.scene.getMeshByName("Start");
      }

      this.screen = MeshBuilder.CreatePlane("Start", { size: 1 });

      let camera = xrCamera.baseExperience.camera;

      this.screen.parent = camera;

      // need to add a vector because the origin of the camera is at top left
      this.screen.position = camera.position.add(new Vector3(0.6, -1.5, 2.75));
      this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.screen);

      let container = new Container("container");
      var rect1 = new Rectangle();
      rect1.width = 0.50;
      rect1.height = 0.20;
      rect1.color = "cyan";
      rect1.thickness = 4;
      rect1.background = "white";
      container.addControl(rect1);

      var text1 = new TextBlock();
      text1.text = text;
      text1.color = "black";
      text1.fontSize = "17px";
      text1.resizeToFit = true;
      text1.textWrapping = true;

      text1.paddingBottomInPixels = 40;
      text1.paddingLeftInPixels = 15;
      text1.paddingRightInPixels = 15;

      rect1.addControl(text1);

      var button1 = Button.CreateSimpleButton("but1", "Click to dismiss");
      button1.width = "150px"
      button1.height = "40px";
      button1.color = "black";
      button1.cornerRadius = 20;
      button1.background = "white";
      button1.topInPixels = 40;
      let prompt = new PromptWithButton(rect1, text1, button1);

      let mesh = (this.scene as Scene).getMeshByName("Start");

      let canvas = document.getElementsByTagName("canvas")[0]
      canvas.addEventListener("pointerdown", function() {
        xrCamera.baseExperience.onStateChangedObservable.add((state) => {
          if (state === WebXRState.IN_XR) {
            pointerUp()
          }
      });
    });


      function pointerUp(){

        container.dispose();
        mesh.dispose();
        if (buttonClickCallBack) {
          buttonClickCallBack(...args);
        }
        if (xrCamera) {

          xrCamera.pointerSelection.displayLaserPointer = false;
          xrCamera.pointerSelection.displaySelectionMesh = false;
        }
      }

      prompt.button.onPointerUpObservable.add(function () {
        pointerUp()
     
      });
      prompt.button.onPointerEnterObservable.add(() => {
          button1.background = "grey";
      })
      prompt.button.onPointerOutObservable.add(() => {
          button1.background = "white";
      })
      container.addControl(prompt.button);
      container.addControl(button1);

      this.advancedTexture.addControl(container);

      return prompt;
  }

    createPromptWithButton(text: string, xrCamera: WebXRDefaultExperience = null, buttonClickCallBack = null, ...args) {

        // need to add a vector because the origin of the camera is at top left

        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        let container = new Container("container");
        var rect1 = new Rectangle();
        rect1.width = 0.50;
        rect1.height = 0.30;
        rect1.color = "cyan";
        rect1.thickness = 4;
        rect1.background = "white";
        container.addControl(rect1);

        var text1 = new TextBlock();
        text1.text = text;
        text1.color = "black";
        text1.fontSize = "17px";
        text1.resizeToFit = true;
        text1.textWrapping = true;

        text1.paddingBottomInPixels = 40;
        text1.paddingLeftInPixels = 15;
        text1.paddingRightInPixels = 15;

        rect1.addControl(text1);


        var button1 = Button.CreateSimpleButton("but1", "Click to dismiss");
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "black";
        button1.cornerRadius = 20;
        button1.background = "white";
        button1.topInPixels = 40;
        let prompt = new PromptWithButton(rect1, text1, button1);

        this.advancedTexture.addControl(container);


        let canvas = document.getElementsByTagName("canvas")[0]
        canvas.addEventListener("pointerdown", function() {
          xrCamera.baseExperience.onStateChangedObservable.add((state) => {
            if (state === WebXRState.IN_XR) {
              pointerUp()
            }
        });
      });


        function pointerUp(){

          container.dispose();
          if (buttonClickCallBack) {
            buttonClickCallBack(...args);
          }
          if (xrCamera) {

            xrCamera.pointerSelection.displayLaserPointer = false;
            xrCamera.pointerSelection.displaySelectionMesh = false;
          }
        }

        this.containers["p1"] = pointerUp;


        prompt.button.onPointerUpObservable.add(function () {
          pointerUp()
       
        });
        prompt.button.onPointerEnterObservable.add(() => {
            button1.background = "grey";
        })
        prompt.button.onPointerOutObservable.add(() => {
            button1.background = "white";
        })
        container.addControl(prompt.button);
        container.addControl(button1);

        this.advancedTexture.addControl(container);

        return prompt;
    }
}
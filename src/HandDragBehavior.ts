// import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
// import { Behavior } from '@babylonjs/core/Behaviors/behavior';
// import { Mesh } from '@babylonjs/core/Meshes/mesh';
// import { Color3 } from '@babylonjs/core/Maths/math.color';
// import { Nullable } from '@babylonjs/core/types';
// import { Vector3, WebXRDefaultExperience } from '@babylonjs/core';


// export default class HandDragBehavior implements Behavior<Mesh> {
//     mesh!: Mesh;
//     xrCamera: WebXRDefaultExperience
//     prevPos: Vector3[];


//     constructor(xrCamera) {
//         this.xrCamera = xrCamera;
//         this.prevPos = [];

//         setTimeout(() => {
//             console.log()
//         })
//     }

//     get name() {
//         return 'Highlight';
//     }

//     init() {

//     }

//     attach = (mesh: Mesh) => {
//         this.mesh = mesh;
//         this.highlightLayer.addMesh(this.mesh, this.highlightColor);
//     }

//     detach = () => {
//         this.highlightLayer.removeMesh(this.mesh);
//         this.highlightReferences = 0;
//         this.highlightingMeshes = [];
//     }

//     highlightSelf = (): void => {
//         this.highlightLayer.isEnabled = true;
//     }

//     unhighlightSelf = (): void => {
//         if (!this.highlightReferences) {
//             this.highlightLayer.isEnabled = false;
//         }
//     }

//     highlightMesh = (targetMesh: Mesh): boolean => {
//         if (this.highlightingMeshes.find(mesh => mesh === targetMesh)) {
//             return false;  // This mesh is already highlighting the target mesh.
//         }
//         const targetMeshHighlightBehavior = targetMesh.getBehaviorByName(this.name) as Nullable<HandDragBehavior>;
//         if (targetMeshHighlightBehavior) {
//             targetMeshHighlightBehavior.highlightReferences += 1;
//             targetMeshHighlightBehavior.highlightSelf();
//             this.highlightingMeshes.push(targetMesh);
//             return true;
//         }
//         return false;
//     }

//     unhighlightMesh = (targetMesh: Mesh): boolean => {
//         const targetMeshHighlightBehavior = targetMesh.getBehaviorByName(this.name) as Nullable<HandDragBehavior>;
//         if (!targetMeshHighlightBehavior) {
//             return false;
//         }
//         const highlightingMeshesIndex = this.highlightingMeshes.findIndex(mesh => mesh === targetMesh);
//         if (highlightingMeshesIndex === -1) {
//             return false;  // This mesh is not currently highlighting the target mesh.
//         }
//         targetMeshHighlightBehavior.highlightReferences -= 1;
//         targetMeshHighlightBehavior.unhighlightSelf();
//         this.highlightingMeshes.splice(highlightingMeshesIndex, 1);
//         return true;
//     }
// }

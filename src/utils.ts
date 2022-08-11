import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Sound } from '@babylonjs/core/Audio/sound';


export function setBoundingInfoFromChildren(mesh: AbstractMesh): [Vector3, Vector3] {
    const { min, max } = mesh.getHierarchyBoundingVectors();  // Note: this method works strangely with cloned meshes
    mesh.setBoundingInfo(new BoundingInfo(min, max));
    return [min, max];
}

export function showBoundingBoxes(...meshes: AbstractMesh[]) {
    meshes.forEach(mesh => mesh.showBoundingBox = true);
}

export function hideBoundingBoxes(...meshes: AbstractMesh[]) {
    meshes.forEach(mesh => mesh.showBoundingBox = false);
}

export function playSound(sound: Sound) {
    const audioContext = Engine.audioEngine!.audioContext!;
    if (audioContext.state !== 'running') {
        audioContext.resume().then(() => sound.play());
    } else sound.play();
}

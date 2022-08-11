import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import { BoundingBox } from '@babylonjs/core/Culling/boundingBox';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Sound } from '@babylonjs/core/Audio/sound';


export function setBoundingInfoFromChildren(mesh: AbstractMesh): [Vector3, Vector3] {
    const { min, max } = mesh.getHierarchyBoundingVectors(true, mesh => mesh.isVisible);  // Note: this method works strangely with cloned meshes
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

export function calculateNearestOffset(collidedMeshBoundingBox: BoundingBox, collidingMeshBoundingBox: BoundingBox) {
    const diffs = [{ diff: collidedMeshBoundingBox.minimumWorld.x - collidingMeshBoundingBox.maximumWorld.x, direction: 'x' }, { diff: collidedMeshBoundingBox.maximumWorld.x - collidingMeshBoundingBox.minimumWorld.x, direction: 'x' },
                   { diff: collidedMeshBoundingBox.minimumWorld.y - collidingMeshBoundingBox.maximumWorld.y, direction: 'y' }, { diff: collidedMeshBoundingBox.maximumWorld.y - collidingMeshBoundingBox.minimumWorld.y, direction: 'y' },
                   { diff: collidedMeshBoundingBox.minimumWorld.z - collidingMeshBoundingBox.maximumWorld.z, direction: 'z' }, { diff: collidedMeshBoundingBox.maximumWorld.z - collidingMeshBoundingBox.minimumWorld.z, direction: 'z' }];
    const minDiff = diffs.reduce((d1, d2) => {
        return Math.abs(d2.diff) < Math.abs(d1.diff) ? d2 : d1;
    }, { diff: Number.MAX_VALUE, direction: 'x' });

    const offset = new Vector3(minDiff.direction === 'x' ? minDiff.diff : 0,
                               minDiff.direction === 'y' ? minDiff.diff : 0,
                               minDiff.direction === 'z' ? minDiff.diff : 0);
    return offset;
}

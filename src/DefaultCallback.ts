import { BoundingBoxGizmo, Color3 } from "@babylonjs/core";

export function defaultCallBack(result) {
    var gizmo = new BoundingBoxGizmo(Color3.FromHexString("#0984e3"))
    gizmo.ignoreChildren = true;
    var gltfMesh = result[0]
    var bb = BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(gltfMesh)

    gizmo.attachedMesh = bb;

    gizmo.onScaleBoxDragObservable.add(() => {
        console.log("scaleDrag")
    });
    gizmo.onScaleBoxDragEndObservable.add(() => {
        const attachedMesh = gizmo.attachedMesh;
        if (attachedMesh) {
            const bounds = attachedMesh.getHierarchyBoundingVectors(true);
            console.log('size x:', bounds.max.x - bounds.min.x);
            console.log('size y:', bounds.max.y - bounds.min.y);
            console.log('size z:', bounds.max.z - bounds.min.z);

        }
        console.log("scaleEnd")
    });
    gizmo.onRotationSphereDragObservable.add(() => {
        console.log("rotDrag")
    });
    gizmo.onRotationSphereDragEndObservable.add(() => {
        console.log("rotEnd")
    });

    //});
}
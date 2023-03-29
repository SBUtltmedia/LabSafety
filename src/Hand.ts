import { Cylinder } from "./Cylinder";
import { Interact } from "./Interact";

export class Hand extends Interact {
    handedness: string;
    holding: Cylinder | null;

    constructor(cylinders: Array<Cylinder>, handedness: string) {
        super(cylinders);
        this.handedness = handedness;
    }

}
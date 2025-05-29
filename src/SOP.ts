import { Task } from "./task";

// Names are intended to be human readable. IDs are used internally and must be unique.
export const bToCTask = new Task("B -> C", "Pour the contents of cylinder B into cylinder C.", []);
export const cToATask = new Task("C -> A", "Pour the contents of cylinder C into cylinder A.", []);

export const sop = new Task("SOP", "Standard operating procedure for lab safety.", [[bToCTask, cToATask]]);

import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';

import SOP from './SOP';
import { Task } from './constants';

const searchParams = new URLSearchParams(document.location.search);
export const debug = searchParams.get('debug') === '' || searchParams.get('debug')?.toLowerCase() === 'true';

export const performanceMonitor = new PerformanceMonitor();

export let advancedTexture: AdvancedDynamicTexture;

export function setAdvancedTexture(value: AdvancedDynamicTexture) {
    advancedTexture = value;
}

export const pourableTargets: AbstractMesh[] = [];

export const pourRedCylinderTask: Task = {
    complete: false,
    current: true,
    title: 'Pour the First Thing',
    shortDescription: 'Pour the red cylinder into the empty cylinder.',
    description: 'Pour the red cylinder into the empty cylinder, taking care not to spill. Just kidding, you can\'t spill. It\'s literally impossible.'
};

export const pourBlueCylinderTask: Task = {
    complete: false,
    current: false,
    title: 'Pour the Second Thing',
    shortDescription: 'Pour the blue cylinder into the same cylinder you poured the red.',
    description: 'Pour the blue cylinder into the same cylinder you poured the red, taking care not to spill. Just kidding, you can\'t spill. It\'s literally impossible.'
};

export const bToCTask: Task = {
    complete: false,
    current: true,
    title: 'B into C',
    shortDescription: 'Pour chemical B into chemical C.',
    description: 'Pour chemical B into chemical C.'
};

export const cToATask: Task = {
    complete: false,
    current: false,
    title: 'B+C into A',
    shortDescription: 'Pour the chemical mixture B+C into chemical A.',
    description: 'Pour the chemical mixture B+C into chemical A.'
};


export const sop = new SOP('Pouring Things Into Things', 'Pour a thing into another thing.');

const addTasks = () => {
    sop.addDependentTask(bToCTask, true);
    sop.addDependentTask(cToATask);
};

addTasks();

export function resetGlobals() {
    performanceMonitor.reset();
    pourableTargets.splice(0, pourableTargets.length);

    bToCTask.complete = false;
    bToCTask.current = true;
    
    cToATask.complete = false;
    cToATask.current = false;
    
    sop.reset();
    addTasks();
}

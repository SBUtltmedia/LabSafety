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


export const sop = new SOP('Pouring Things Into Things', 'Pour a thing into another thing.');

const addTasks = () => {
    sop.addDependentTask(pourRedCylinderTask, true);
    sop.addDependentTask(pourBlueCylinderTask);
};

addTasks();

export function resetGlobals() {
    performanceMonitor.reset();
    pourableTargets.splice(0, pourableTargets.length);

    pourRedCylinderTask.complete = false;
    pourRedCylinderTask.current = true;
    
    pourBlueCylinderTask.complete = false;
    pourBlueCylinderTask.current = false;
    
    sop.reset();
    addTasks();
}

import { HUD_HINTS_PATH } from "./Constants";
import { IHUDHints, global } from "./GlobalState";
import { GameStates, StateMachine } from "./StateMachine";
import {Howl, Howler} from 'howler';

export let stateMachine: StateMachine;

export type HudHint = {[key: string]: string};

export let soundMap = new Map<HudHint, string[]>();

export const platformMap: {[key: string]: number} = {
    "desktop": 0,
    "mobile": 1,
    "xr": 2
};

export let HUDAudioFiles = new Map<string, Howl>();

const createAndLoadHowl = (fileName: string): Promise<Howl> => {
    return new Promise((resolve, reject) => {
        console.log("file name: ", fileName);
        const sound = new Howl({
            src: [fileName],
            autoplay: false,
            loop: false,
            volume: 1.0,
            onload: () => {
                console.log(`${fileName} has loaded`);
                resolve(sound);
            },
            onloaderror: (id, error) => {
                console.log(`Error loading ${fileName}: ${error}`);
                reject(error);
            }
        });
    });
};

const loadFilesRecursively = async (keys: string[], index = 0): Promise<void> => {
    if (index >= keys.length) {
        console.log("All files have been loaded");
        return;
    }

    try {
        const fileName = keys[index];
        const sound = await createAndLoadHowl(fileName);
        HUDAudioFiles.set(fileName, sound);
        console.log(`File at index ${index} loaded successfully`);
        await loadFilesRecursively(keys, index + 1); // Load the next file
    } catch (error) {
        console.log(`Error loading file at index ${index}:`, error);
        await loadFilesRecursively(keys, index + 1); // Load the next file
    }
};

export const setupGameStates = async(platform: string) => {
    console.log(global.hudHints);
    if (Object.keys(global.hudHints).length === 0) {
        fetch(HUD_HINTS_PATH)
            .then(r => r.json())
            .then((json: IHUDHints) => {
                global.hudHints = Object.assign({}, json);
                Object.keys(global.hudHints).map((hudName, idx) => {
                    soundMap.set(global.hudHints[hudName], [`${idx * 3}`, `${(idx * 3) + 1}`, `${(idx * 3) + 2}`]);
                });
                soundMap.keys().forEach(key => {
                    const idxarr = soundMap.get(key);
                    ["desktop", "mobile", "xr"].forEach(platform => {
                        idxarr.forEach(idx => {
                            const fileName = `sounds/${platform}_${idx}.wav`;
                            HUDAudioFiles.set(fileName, null);
                        })
                    })
                })
            
                const filenames = HUDAudioFiles.keys().toArray();

                loadFilesRecursively(filenames).then(() => {
                    console.log("All files loaded");
                    stateMachine = new StateMachine(platform);
                    stateMachine.onStateChangeObervable.notifyObservers(GameStates.BASE);
                });
            });
    } else {
        console.log("Re setup game states");
        stateMachine = new StateMachine(platform);
        stateMachine.onStateChangeObervable.notifyObservers(GameStates.BASE);        
    }
}
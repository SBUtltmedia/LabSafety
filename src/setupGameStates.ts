import { HUD_HINTS_PATH } from "./Constants";
import { IHUDHints, global } from "./globalState";
import { GameStates, StateMachine } from "./stateMachine";
import {Howl, Howler} from 'howler';

export let stateMachine: StateMachine;

export type HudHint = {[key: string]: string};
export interface FileArray {[key: string]: string};

export let soundMap = new Map<HudHint, number>();

export const platformMap: {[key: string]: number} = {
    "desktop": 0,
    "mobile": 1,
    "xr": 2
};

export let HUDAudioFiles = new Map<string, Howl>();
export let HintAudioFiles = new Map<HudHint, FileArray>();

const filePathPrefix = "sounds/narration"

const createHowlerObject = (filename: string) => {
    return new Promise((resolve, reject) => {
        const sound = new Howl({
            src: [`${filePathPrefix}/${filename}`],
            autoplay: false,
            loop: false,
            volume: 1.0,
            onload: () => {
                HUDAudioFiles.set(filename, sound);
                resolve(sound);
            },
            onloaderror: (id, error) => {
                console.log(`Error loading file ${filename}`, error);
                reject(error);
            }
        });
    })
}

const loadFiles = async (fileIdx: number) => {
    const filenames = HUDAudioFiles.keys().toArray();

    if (fileIdx >= filenames.length) {
        console.log("All files loaded");
        return;
    }

    await createHowlerObject(filenames[fileIdx]);
    await loadFiles(fileIdx + 1);
}

export const setupGameStates = async(platform: string) => {
    if (Object.keys(global.hudHints).length === 0) {
        fetch(HUD_HINTS_PATH)
            .then(r => r.json())
            .then((json: IHUDHints) => {
                global.hudHints = Object.assign({}, json);
                Object.keys(global.hudHints).map((hudName, hudIdx) => {
                    soundMap.set(global.hudHints[hudName], hudIdx + 1);
                    HintAudioFiles.set(global.hudHints[hudName], {"desktop": `desktop_${hudIdx + 1}.wav`, "mobile": `mobile_${hudIdx + 1}.wav`, "xr": `xr_${hudIdx + 1}.wav`});
                });
                soundMap.keys().forEach(key => {
                    const hudIdx = soundMap.get(key);
                    ["desktop", "mobile", "xr"].forEach(platform => {
                        const fileName = `${platform}_${hudIdx}.wav`;
                        HUDAudioFiles.set(fileName, null);
                    })
                })
            
                loadFiles(0).then(() => {
                    stateMachine = new StateMachine(platform);
                });
            });
    } else {
        stateMachine = new StateMachine(platform);
        stateMachine.onStateChangeObervable.notifyObservers(GameStates.BASE);        
    }
}
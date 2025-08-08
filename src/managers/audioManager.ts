import {StateMachine } from "../systems/stateMachine";
import {Howl} from 'howler';

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

export const loadAudioFile = async (filename: string) => {
    let howlerObject = await createHowlerObject(filename);
    return howlerObject;
}
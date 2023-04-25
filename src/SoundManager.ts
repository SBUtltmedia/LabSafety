import { Engine, Scene, Sound } from "@babylonjs/core";

interface SoundObject {
    soundName: string
    fileName: string
};

interface SoundLoaded {
    soundName: string
    sound: Sound
}

export class SoundManager {
    soundList: Array<SoundObject>;
    soundPointer: number;
    scene: Scene;
    loadedSounds;

    constructor(soundList: Array<SoundObject>, scene: Scene) {
        this.scene = scene;
        this.soundPointer = 0;
        this.soundList = soundList;
        this.loadedSounds = {};
    }

    async loadSounds() {
        let allSounds: Array<SoundLoaded> = [];
        return new Promise((resolve) => {
            let len = 0;
            
            this.soundList.forEach((soundObject) => {
                allSounds.push({"soundName": soundObject.soundName, "sound": new Sound(
                    soundObject.soundName,
                    soundObject.fileName,
                    this.scene,
                    () => {
                        Engine.audioEngine.unlock();
                    },
                    {

                    }
                )})
                len++;
                if (len === this.soundList.length) {
                    for (let sound of allSounds) {
                        this.loadedSounds[sound.soundName] = sound.sound;
                    }
                    resolve(allSounds);
                    console.log("Sounds loaded!!", this.loadedSounds);
                }
                
            })

        })
    }

}


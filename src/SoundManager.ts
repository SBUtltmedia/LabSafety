import { Scene, Sound } from "@babylonjs/core";

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
    constructor(soundList: Array<SoundObject>, scene: Scene) {
        this.scene = scene;
        this.soundPointer = 0;
        this.soundList = soundList;
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
                        if (len === this.soundList.length) {
                            resolve(allSounds);
                            console.log("Sounds loaded!!")
                        }
                    }
                )})
                len++;
            })

        })
    }

}


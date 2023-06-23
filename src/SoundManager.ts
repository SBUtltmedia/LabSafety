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
       // Engine.audioEngine.lock();
    }

    enableAudio() {
        Engine.audioEngine.useCustomUnlockedButton = true;

        var button = undefined;
        // Engine.audioEngine.onAudioLockedObservable.add(() => {
        //     if (button) {
        //         return;
        //     }
            
        //     button = document.createElement("button");
        //     button.innerText = "CLICK ON ME !!!";
        //     button.style.position = "absolute";
        //     button.style.top = "100px";
        //     button.style.right = "200px";
        //     button.style.zIndex = "99999";
        //     document.body.append(button);
                
        //     button.onclick = () => {
        //         Engine.audioEngine.unlock(); 
        //         button.remove();
        //     };
        // });        
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
                        // Engine.audioEngine.unlock();
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

                }
                
            })

        })
    }

}


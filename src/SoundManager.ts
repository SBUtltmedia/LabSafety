import { Sound } from "@babylonjs/core/Audio/sound"
import { global } from "./GlobalState"


export function loadSounds(filePath: string){
fetch(filePath).then(r => r.json()).then(importSounds)


function importSounds(soundList: {
   name: string,
   path: string
}[]) {
   for (const { name, path } of soundList) {
      global.sounds[name] = new Sound(name, path, undefined);
   }
};


}
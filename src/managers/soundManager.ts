import { Sound } from "@babylonjs/core/Audio/sound"
import { global } from "../globalState"


export async function loadSounds(filePath: string): Promise<void> {
   function importSounds(soundList: {
      name: string,
      path: string
   }[]) {
      for (const { name, path } of soundList) {
         global.sounds[name] = new Sound(name, path, undefined);
      }
   }
   
   return fetch(filePath).then(r => r.json()).then(importSounds);
}
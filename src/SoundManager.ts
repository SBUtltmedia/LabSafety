import { Sound } from "@babylonjs/core/Audio/sound"
import { global } from "./GlobalState"


export function loadSounds(filePath){
fetch(filePath).then(r=>r.json()).then(importSounds)


function importSounds(soundList){

   if(soundList.length){
   
    let currentSound=soundList[0];
   
    let newSoundList=soundList.slice(1)
   
       global.sounds[currentSound.name] = new Sound(currentSound.name,currentSound.path,null,()=>importSounds(newSoundList))
   }
    
};


}
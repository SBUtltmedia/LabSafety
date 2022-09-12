import { Scene } from '@babylonjs/core/scene';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';

import { resetLastCreatedScene } from './scene';
import { advancedTexture } from './globals';

export function displayFailScreen(scene: Scene) {
    const textBlock = new TextBlock('fail-message', 'Oh no! Always read the SOP!');
    const retryButton = Button.CreateSimpleButton('retry-button', 'Try again');

    textBlock.color = 'white';
    textBlock.fontSizeInPixels = 24;
    textBlock.heightInPixels = 40;
    
    retryButton.color = 'white';
    retryButton.fontSizeInPixels = 20;
    retryButton.widthInPixels = 200;
    retryButton.heightInPixels = 80;
    retryButton.background = 'blue';
    retryButton.topInPixels = textBlock.topInPixels + 80;

    advancedTexture.addControl(textBlock);
    advancedTexture.addControl(retryButton);

    retryButton.onPointerClickObservable.add(resetLastCreatedScene);
}
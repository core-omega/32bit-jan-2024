import * as Phaser from 'phaser';
import {TitleScene} from "./modules/scenes/title.js";
import {GameScene} from "./modules/scenes/game.js";
import {SummaryScene} from "./modules/scenes/summary.js";
import { ForceHideOverlay, ForceShowOverlay } from './modules/display/show.js';

function StartGame() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        scene: [TitleScene, GameScene, SummaryScene],
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'arcade',
            arcade: {
            }
        }
    };
    
    const game = new Phaser.Game(config);
    ForceHideOverlay();
}

window.addEventListener('load', () => {
    ForceShowOverlay(" <a id='start-button'>Click here to start the game.</a>");
    document.getElementById('start-button').addEventListener('click', StartGame, false);
}, false);

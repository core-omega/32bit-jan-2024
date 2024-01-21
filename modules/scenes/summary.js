import * as Phaser from 'phaser';
import { GetPerformanceMonitor } from '../utility/performance.js';

class SummaryScene extends Phaser.Scene {
    constructor( ...args ) {
        super({ key: 'scene.summary', ...args });
    }

    preload () {
        this.load.image('sprite.ship', 'sprite/32b_ship.png');
        this.load.image('particle.red', 'particle/red16.png');
        this.load.image('particle.lightblue', 'particle/lightblue16.png');
        this.load.audio('music.win', 'music/Win/Win.wav');
        this.load.audio('sound.entry', 'sound/BattleEntry.wav');
        this.load.spritesheet('sprite.wormhole', 'sprite/32b_wormhole.png', {
            frameWidth: 512, 
            frameHeight: 512
        });
        this.performance = GetPerformanceMonitor();
        this.startup = window.performance.now();
    }

    create () {
        this.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.audio = this.sound.add('music.win', {
            loop: true,
            volume: 1
        });
        this.audio.play();

        this.wormhole = this.add.sprite(400, 125, 'sprite.wormhole');
        this.wormhole.setScale(1, 1);

        this.startText = this.add.text(200, 420, "Sector cleared!  Press 'ENTER' to move to next sector.", {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#dfdfdf'
        });
    }

    update() {
        this.performance.update();

        if(this.enter.isDown) {
            let audio = this.sound.add('sound.entry', {
                volume: 1
            });
            audio.play();

            console.log("[title-screen] Transitioning to next scene ...");
            this.audio.stop();
            this.scene.start('scene.game');
        }

        this.wormhole.rotation += 0.0005;

    }
}

export {SummaryScene}

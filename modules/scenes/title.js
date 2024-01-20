import * as Phaser from 'phaser';
import { GetPerformanceMonitor } from '../utility/performance.js';
import { GameScene } from "../scenes/game.js";

class TitleScene extends Phaser.Scene {
    static TITLE_COLOR_FADE_TIMER = 5000;

    constructor( ...args ) {
        super({ key: 'scene.title', ...args })
    }

    preload () {
        this.load.image('sprite.ship', 'sprite/32b_ship.png');
        this.load.image('particle.red', 'particle/red16.png');
        this.load.image('particle.lightblue', 'particle/lightblue16.png');
        this.load.audio('music.intro', 'music/Intro/Intro.wav');
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

        this.audio = this.sound.add('music.intro', {
            loop: true,
            volume: 1
        });
        this.audio.play();

        this.wormhole = this.add.sprite(400, 225, 'sprite.wormhole');
        this.wormhole.setScale(1, 1);

        this.ship = this.physics.add.image(400, 500, 'sprite.ship');
        this.ship.setScale(2.0, 2.0);

        this.ship.setVelocity(100, 0);
        this.ship.setBounce(1, 1);
        this.ship.setCollideWorldBounds(true);

        this.titleText = this.add.text(320, 40, "Negative Space", {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#eb00eb'
        });

        this.startText = this.add.text(320, 420, "Press 'ENTER' to start.", {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#dfdfdf'
        });

        this.add.text(10, 580, "1P: Free Play - Infinite Credits", {
            fontFamily: 'monospace',
            fontSize: "10px",
            color: "#eeeeee"
        });

        this.add.text(620, 580, "2P: 0 Credits (Insert Quarter)", {
            fontFamily: 'monospace',
            fontSize: "10px",
            color: "#eeeeee"
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

export {TitleScene}

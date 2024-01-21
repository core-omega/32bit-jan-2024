import * as Phaser from 'phaser';
import { Gauge } from '../display/gauge.js';
import { Projectile } from '../objects/projectile.js';
import { PlayerShip } from '../objects/ship.js';
import { Shield } from "../objects/shield.js";
import { GetPerformanceMonitor } from '../utility/performance.js';
import { GameMap } from '../world/map.js';

class GameScene extends Phaser.Scene {

    constructor( ...args ) {
        super({ key: 'scene.game', ...args });
    }

    preload() {
        this.load.image('sprite.ship', 'sprite/32b_ship.png');
        this.load.image('sprite.wormhole', 'sprite/32b_wormhole.png');
        this.load.image('enemy.spinner', 'sprite/32b_enemy_spinner.png');
        this.load.image('enemy.sprayer', 'sprite/32b_enemy_sprayer.png');
        this.load.image('enemy.thresher', 'sprite/32b_enemy_thresher.png');
        this.load.image('background.planet', 'sprite/32b_s1_planet_bg_r2.png');
        this.load.image('background.stars1', 'sprite/32b_s1_stars_bg.png');
        this.load.image('particle.lightblue', 'particle/lightblue16.png');
        this.load.image('particle.blue', 'particle/blue16.png');
        this.load.image('particle.offwhite', 'particle/offwhite16.png');
        this.load.image('particle.red', 'particle/red16.png');
        this.load.audio('music.stage1', 'music/Stage_1/Stage_1.wav');
        this.load.audio('sound.shot', 'sound/Shot.wav');
        this.load.audio('sound.shield', 'sound/Shield.wav');
        this.load.audio('sound.wormhole', 'sound/Wormhole.wav');
        this.load.audio('sound.hit', 'sound/Hit.wav');
        this.load.audio('sound.explosion', 'sound/Explode.wav');
        this.performance = GetPerformanceMonitor();
    }

    createBoundingLights() {
        this.leftBound = new Phaser.Geom.Line(20, 10, 20, 590);
        this.topBound = new Phaser.Geom.Line(20, 10, 800, 10);
        this.rightBound = new Phaser.Geom.Line(800, 10, 800, 590);
        this.bottomBound = new Phaser.Geom.Line(20, 590, 895, 590);  // go off the edge of the screen, since last light never appears otherwise
        this.bounds = this.add.particles(-10, 0, 'particle.offwhite', {
            lifespan:  1500,
            quantity: 1
        });

        this.bounds.addEmitZone({
            type: 'edge',
            source: this.topBound,
            quantity: 8,
            total: 8
        });
        this.bounds.addEmitZone({
            type: 'edge',
            source: this.leftBound,
            quantity: 8,
            total: 8
        });
        this.bounds.addEmitZone({
            type: 'edge',
            source: this.bottomBound,
            quantity: 9,
            total: 9
        });
        this.bounds.addEmitZone({
            type: 'edge',
            source: this.rightBound,
            quantity: 8,
            total: 8
        });
    }

    create() {
        this.inputLock = false;

        this.audio = this.sound.add('music.stage1', {
            loop: true,
            volume: 0.5
        });
        this.audio.play();

        this.projectiles = [];
        this.enemies = [];
        this.ship = new PlayerShip({ lives: 10 });
        this.ship.create(this);
        
        this.sector = new GameMap({ });
        this.sector.create(this);

        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);  // FIXME: used by GameMap, not locally.

        this.createBoundingLights();

        this.introText = this.add.text(300, 300, "Mission Start: Clear the Sector", {
            fontFamily: 'monospace'
        });

        this.livesSprite = this.add.sprite(28, 65, 'sprite.ship');

        this.livesText = this.add.text(40, 60, "x ", {
            fontFamily: 'monospace',
            fontSize: '10px'
        });

        this.deathText = this.add.text(300, 300, "Ship destroyed - press ENTER to launch another.", {
            fontFamily: 'monospace',
            fontSize: '12px'
        });
        this.deathText.setVisible(false);

        this.gameOverText = this.add.text(280, 300, "Game over, man.  Press ENTER to try a different sector.", {
            fontFamily: 'monospace',
            fontSize: '12px'
        });
        this.gameOverText.setVisible(false);

        this.controlsText = this.add.text(250, 30, "W, A, S, D - move.  Q - shield.  E - enter wormhole.  SPACE - shoot.", {
            fontFamily: 'monospace',
            fontSize: '10px'
        });

        this.scoreText = this.add.text(20, 40, "Score: 0", {
            fontFamily: 'monospace',
            fontSize: '10px'
        });

        this.score = (window.score) ? window.score : 0;
        if(window.score) {
            delete window.score;
        }
        this.addScore(0);
        this.ship.addLives(0);
    }

    winner() {
        window.score = this.score;
    }

    updateLives(lives) {
        this.livesText.setText("x " + lives);
    }

    addScore(value) {
        this.score += value;
        this.scoreText.setText("Score: " + this.score);
    }

    clearScore() {
        this.score = 0;
        this.scoreText.setText("Score: " + this.score);
    }

    update() {
        if(this.ship.isDead && this.ship.lives > 0) {
            this.deathText.setVisible(true);
            this.gameOverText.setVisible(false);
        }
        else if(this.ship.isDead) {
            this.deathText.setVisible(false);
            this.gameOverText.setVisible(true);
        }
        else {
            this.deathText.setVisible(false);
            this.gameOverText.setVisible(false);
        }

        this.sector.update();
        this.performance.update();
        this.ship.update();

        if(this.introText) {
            this.introText.setAlpha(this.introText.alpha * 0.99);
            if(this.introText.alpha < 0.01) {
                this.introText.destroy();
                delete this.introText;
            }
        }

        if(this.controlsText) {
            this.controlsText.setAlpha(this.controlsText.alpha * 0.999);
            if(this.controlsText.alpha < 0.01) {
                this.controlsText.destroy();
                delete this.controlsText;
            }
        }

        this.handleInput();

        this.updateProjectiles();
    }

    onShotHit() {
        this.destroyShip();   
    }

    destroyShip() {
        this.ship.destroyShip();
    }

    clearProjectiles() {
        for(let projectile of this.projectiles) {
            projectile.kill();
        }
    }

    updateProjectiles() {
        for(let projectile of this.projectiles) {
            projectile.update();
            projectile.checkHits(this.ship, this.sector.active.enemies);
        }

        for(var i = this.projectiles.length - 1; i >= 0; --i) {
            if(!this.projectiles[i].isAlive()) {
                // console.log("[game] Reaping projectile: " + i);
                this.projectiles.splice(i, 1);
            }
        }
    }


    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    setInputLock(value) {
        console.log("[game-scene] Locking input: " + value);
        this.inputLock = value;
    }

    handleInput() {
        // Need to check for this before the input lock.
        if(this.keyEnter.isDown) {
            if(this.ship.isDead && this.ship.lives > 0) {
                console.log("[game-scene] Launching new ship ...");
                this.ship.rebuildSprite();
                this.sector.active.resetRoom();
                this.setInputLock(false);
                this.ship.isDying = false;
                this.ship.isDead = false;
                this.clearProjectiles();
            }
            else if(this.ship.lives == 0) {
                console.log("[game-scene] Generating new sector ...");
                this.audio.stop();
                this.scene.restart();
            }
        }

        if(this.inputLock) {
            return;
        }

        this.ship.handleInput();
    }

}

export {GameScene}

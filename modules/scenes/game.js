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
        this.ship = new PlayerShip({ });
        this.ship.create(this);
        
        this.sector = new GameMap({ });
        this.sector.create(this);

        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);  // FIXME: used by GameMap, not locally.

        this.createBoundingLights();

        this.introText = this.add.text(300, 300, "Mission Start: Clear the Sector", {
            fontFamily: 'monospace'
        });

        this.livesSprite = this.add.sprite(28, 45, 'sprite.ship');

        this.livesText = this.add.text(40, 40, "x 3", {
            fontFamily: 'monospace',
            fontSize: '10px'
        });

        this.deathText = this.add.text(300, 300, "Ship destroyed - press ENTER to launch another.", {
            fontFamily: 'monospace',
            fontSize: '12px'
        });
        this.deathText.setVisible(false);

        this.gameOverText = this.add.text(380, 300, "Game over, man.", {
            fontFamily: 'monospace',
            fontSize: '12px'
        });
        this.gameOverText.setVisible(false);

        this.controlsText = this.add.text(250, 30, "W, A, S, D - move.  Q - shield.  E - enter wormhole.  SPACE - shoot.", {
            fontFamily: 'sans-serif',
            fontSize: '10px'
        });

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

        this.ship.sprite.setAcceleration(0);
        this.ship.sprite.setAngularVelocity(0);

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

        this.ship.energy.update();
        this.ship.shield.update();
    }

    onShotHit() {
        this.destroyShip();   
    }

    destroyShip() {
        if(this.ship.isDying || this.ship.isDead) {
            return;
        }
        console.log("[game-scene] Triggering ship destruction: lives remaining = " + this.ship.lives);
        this.ship.isDying = true;
        this.ship.sprite.setVisible(false);
        this.setInputLock(true);
        this.ship.explosion = this.add.particles(this.ship.sprite.x, this.ship.sprite.y, 'particle.red', {
            blendMode: 'ADD',
            quantity: 5,
            speed: 40,
            lifespan: 1000
        });
        let audio = this.sound.add('sound.explosion', {
            volume: 1
        });
        audio.play();
        setTimeout(() => {
            this.ship.explosion.destroy();
            this.ship.isDead = true;
            this.livesText.destroy();
            this.livesText = this.add.text(40, 40, "x " + this.ship.lives, {
                fontFamily: 'monospace',
                fontSize: '10px'
            });

        }, 1000);
        this.ship.lives --;
        if(this.ship.lives <= 0) {
            console.log("[game-scene] Game over, man.");
        }
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
        console.log("Locking input: " + value);
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
        }

        if(this.inputLock) {
            return;
        }

        this.ship.handleInput();
    }

}

export {GameScene}

import * as Phaser from 'phaser';
import { Gauge } from '../display/gauge.js';
import { Projectile } from '../objects/projectile.js';
import { Shield } from "../objects/shield.js";
import { GetPerformanceMonitor } from '../utility/performance.js';
import { GameMap } from '../world/map.js';

class GameScene extends Phaser.Scene {

    static SHIP_MAX_VELOCITY = 100;
    static SHIP_ANGULAR_DRAG = 100;
    static SHIP_DRAG = 100;
    static SHIP_ACCELERATION_FACTOR = 80;
    static SHIP_ROTATION_FACTOR = 240;
    static SHIP_SHOOT_RATE = 0.10;
    static SHIP_SHOT_COST = 15.0;
    static SHIP_HOMING_COST = 20.0;
    static SHIP_BEAM_COST = 40.0;
    static SHIP_SCALE = 2.0;

    constructor( ...args ) {
        super({ key: 'scene.game', ...args });
    }

    preload() {
        this.load.image('sprite.ship', 'sprite/32b_ship.png');
        this.load.image('sprite.wormhole', 'sprite/32b_wormhole.png');
        this.load.image('enemy.spinner', 'sprite/32b_enemy_spinner.png');
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

    createShip() {
        this.ship = this.physics.add.image(400, 500, 'sprite.ship');
        this.ship.setMaxVelocity(GameScene.SHIP_MAX_VELOCITY, GameScene.SHIP_MAX_VELOCITY);
        this.ship.setScale(GameScene.SHIP_SCALE, GameScene.SHIP_SCALE);
        this.ship.setCollideWorldBounds(true);
        this.ship.setAngularDrag(GameScene.SHIP_ANGULAR_DRAG);
        this.ship.setDrag(GameScene.SHIP_DRAG);
        this.ship.setDepth(1);
        this.ship.lastShot = window.performance.now(); 

        this.ship.energy = new Gauge({
            x: 770,
            y: 80,
            label: "EN"
        });
        this.ship.energy.create(this);

        this.ship.shield = new Shield({ });
        this.ship.shield.create(this, this.ship);
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
        this.createShip();
        
        this.sector = new GameMap({ });
        this.sector.create(this);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.createBoundingLights();

        this.introText = this.add.text(300, 300, "Mission Start: Clear the Sector", {
            fontFamily: 'monospace'
        });

        this.controlsText = this.add.text(250, 30, "W, A, S, D - move.  Q - shield.  E - enter wormhole.  SPACE - shoot.", {
            fontFamily: 'sans-serif',
            fontSize: '10px'
        });

    }

    update() {
        this.sector.update();
        this.performance.update();

        this.ship.setAcceleration(0);
        this.ship.setAngularVelocity(0);

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

    fireProjectile() {
        if(this.ship.energy.canUse(GameScene.SHIP_SHOT_COST)) {
            let duration = (window.performance.now() - this.ship.lastShot) / 1000.0;
            if(duration > GameScene.SHIP_SHOOT_RATE) {
                this.ship.energy.use(GameScene.SHIP_SHOT_COST);
                let projectile = new Projectile();
                let position = this.ship.getTopCenter();
                projectile.init({
                    type: Projectile.TYPE_SHOT,
                    isPlayerOwned: true,
                    rotation: this.ship.rotation,
                    scene: this,
                    position: position
                });
                this.projectiles.push(projectile);
                this.ship.lastShot = window.performance.now();
                let audio = this.sound.add('sound.shot', {
                    volume: 1
                });
                audio.play();
            }
        }
    }

    setInputLock(value) {
        console.log("Locking input: " + value);
        this.inputLock = value;
    }

    activateShield() {
        if(this.ship.shield.canActivate()) {
            this.ship.shield.activate();
        }
    }

    handleInput() {
        if(this.inputLock) {
            return;
        }

        if (this.cursors.left.isDown || this.keyA.isDown)
        {
            this.ship.setAngularVelocity(-GameScene.SHIP_ROTATION_FACTOR);
        }
        else if (this.cursors.right.isDown || this.keyD.isDown)
        {
            this.ship.setAngularVelocity(GameScene.SHIP_ROTATION_FACTOR);
        }

        if (this.cursors.up.isDown || this.keyW.isDown)
        {
            let x = Math.cos(this.ship.rotation + Math.PI / 2);
            let y = Math.sin(this.ship.rotation + Math.PI / 2);
            this.ship.setAcceleration(-GameScene.SHIP_ACCELERATION_FACTOR * x, -GameScene.SHIP_ACCELERATION_FACTOR * y);
        }
        else if (this.cursors.down.isDown || this.keyS.isDown)
        {
            let x = Math.cos(this.ship.rotation + Math.PI / 2);
            let y = Math.sin(this.ship.rotation + Math.PI / 2);
            this.ship.setAcceleration(GameScene.SHIP_ACCELERATION_FACTOR * x, GameScene.SHIP_ACCELERATION_FACTOR * y);
        }

        if(this.keyQ.isDown) {
            this.activateShield();
        }

        if(this.keySpace.isDown) {
            this.fireProjectile();
        }
    }

}

export {GameScene}

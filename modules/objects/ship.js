import { Gauge } from "../display/gauge.js";
import { Projectile } from "../objects/projectile.js";
import { Shield } from "../objects/shield.js";

class PlayerShip {

    constructor(config) {
        config = (config) ? config : { };
        this.scale = (config.scale) ? config.scale : 2.0;
        this.maxVelocity = (config.maxVelocity) ? config.maxVelocity : 100;
        this.angularDrag = (config.angularDrag) ? config.angularDrag : 100;
        this.drag = (config.drag) ? config.drag : 100;
        this.acceleration = (config.acceleration) ? config.acceleration : 80;
        this.rotation = (config.rotation) ? config.rotation : 240;
        this.shotCost = (config.shotCost) ? config.shotCost : 10.0;
        this.shotRate = (config.shotRate) ? config.shotRate : 0.10;
        this.lives = (config.lives) ? config.lives : 3;

        this.lastShot = window.performance.now();
    }

    create(scene) {
        this.scene = scene;
        this.sprite = this.scene.physics.add.image(400, 500, 'sprite.ship');
        this.sprite.setMaxVelocity(this.maxVelocity, this.maxVelocity);
        this.sprite.setScale(this.scale, this.scale);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setAngularDrag(this.angularDrag);
        this.sprite.setDrag(this.drag);
        this.sprite.setDepth(1);
        this.sprite.lastShot = window.performance.now(); 
        this.sprite.lives = 3;
        this.isDead = false;
        this.isDying = false;

        this.energy = new Gauge({
            x: 770,
            y: 80,
            label: "EN"
        });
        this.energy.create(this.scene);

        this.shield = new Shield({ });
        this.shield.create(this.scene, this);

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyQ = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    addLives(lives) {
        this.lives += lives;
        this.scene.updateLives(this.lives);
    }

    rebuildSprite() {
        this.sprite.setScale(this.scene.ship.scale, this.scene.ship.scale);
        this.sprite.rotation = 0;
        this.sprite.x = 400;
        this.sprite.y = 500;
        this.sprite.setVisible(true);
    }

    activateShield() {
        if(this.shield.canActivate()) {
            this.shield.activate();
        }
    }

    destroyShip() {
        if(this.isDying || this.isDead) {
            return;
        }
        console.log("[game-scene] Triggering ship destruction: lives remaining = " + this.lives);
        this.isDying = true;
        this.sprite.setVisible(false);
        this.scene.setInputLock(true);
        this.explosion = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle.red', {
            blendMode: 'ADD',
            quantity: 7,
            speed: 40,
            lifespan: 1000
        });
        let audio = this.scene.sound.add('sound.explosion', {
            volume: 1
        });
        audio.play();
        this.lives --;
        setTimeout(() => {
            this.explosion.destroy();
            this.isDead = true;
            this.scene.updateLives(this.lives);
        }, 1000);
        if(this.lives <= 0) {
            console.log("[ship] Game over, man.");
        }
    }

    fireProjectile() {
        if(this.energy.canUse(this.shotCost)) {
            let duration = (window.performance.now() - this.lastShot) / 1000.0;
            if(duration > this.shotRate) {
                this.energy.use(this.shotCost);
                let projectile = new Projectile();
                let position = this.sprite.getTopCenter();
                projectile.init({
                    type: Projectile.TYPE_SHOT,
                    isPlayerOwned: true,
                    rotation: this.sprite.rotation,
                    scene: this.scene,
                    position: position
                });
                this.scene.addProjectile(projectile);
                this.lastShot = window.performance.now();
                let audio = this.scene.sound.add('sound.shot', {
                    volume: 1
                });
                audio.play();
            }
        }
    }

    handleInput() {
        if (this.cursors.left.isDown || this.keyA.isDown)
        {
            this.sprite.setAngularVelocity(-this.rotation);
        }
        else if (this.cursors.right.isDown || this.keyD.isDown)
        {
            this.sprite.setAngularVelocity(this.rotation);
        }

        if (this.cursors.up.isDown || this.keyW.isDown)
        {
            let x = Math.cos(this.sprite.rotation + Math.PI / 2);
            let y = Math.sin(this.sprite.rotation + Math.PI / 2);
            this.sprite.setAcceleration(-this.acceleration * x, -this.acceleration * y);
        }
        else if (this.cursors.down.isDown || this.keyS.isDown)
        {
            let x = Math.cos(this.sprite.rotation + Math.PI / 2);
            let y = Math.sin(this.sprite.rotation + Math.PI / 2);
            this.sprite.setAcceleration(this.acceleration * x, this.acceleration * y);
        }

        if(this.keyQ.isDown) {
            this.activateShield();
        }

        if(this.keySpace.isDown) {
            this.fireProjectile();
        }
    }

    update() {
        this.sprite.setAcceleration(0);
        this.sprite.setAngularVelocity(0);
        this.energy.update();
        this.shield.update();
    }
}

export {PlayerShip}
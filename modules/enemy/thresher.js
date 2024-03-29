import {Projectile} from '../objects/projectile.js';

class ThresherEnemy {
    static FIRST_SHOT_DELAY = 1000;
    static BASE_SHOT_RATE = 0.1;
    static STUN_SCORE = 100;
    static KILL_SCORE = 3500;

    constructor(config) {
        config = (config) ? config : { };
        this.type = 'thresher';
        this.speed = (config.speed) ? config.speed : 0;
        this.texref = (config.texref) ? config.texref : 'enemy.thresher';
        this.scale = (config.scale) ? config.scale : [0.75, 0.75];
        this.x = (config.x) ? config.x : Math.floor(Math.random() * 200) + 300;
        this.y = (config.y) ? config.y : Math.floor(Math.random() * 150 ) + 150;
        this.hitRadius = (config.hitRadius) ? config.hitRadius : 24;
        this.angularVelocity = (config.angularVelocity) ? config.angularVelocity : 0;
        this.stunned = false;
        this.life = 40;
        this.playDyingAnimation = false;
        this.isDying = false;
        this.isDead = false;
        this.lastShot = window.performance.now();
        this.shotRate = ThresherEnemy.BASE_SHOT_RATE + Math.random() * 0.2;

        this.speed = Math.floor(this.speed * (0.8 + Math.random() * 0.4));
        this.stunTimeout = 2500;
    }

    resetPosition() {
        this.sprite.x = Math.floor(Math.random() * 720) + 40;
        this.sprite.y = Math.floor(Math.random() * 280) + 20;
    }

    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + 
                         (p1.y - p2.y) * (p1.y - p2.y));
    }

    onShotHit(projectile) {
        if(this.isDying || this.isDead) {
            return false;
        }

        let audio = this.scene.sound.add('sound.hit', {
            volume: 1
        });
        audio.play();

        this.life -= projectile.damage;
        if(this.life <= 0) {
            this.isDying = true;
            this.emitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle.blue', {
                blendMode: 'ADD',
                speed: 50,
                lifespan: 750
            });
            this.sprite.destroy();
            let audio = this.scene.sound.add('sound.explosion', {
                volume: 1
            });
            audio.play();
    
            setTimeout(() => {
                this.emitter.setQuantity(0);
                this.emitter.destroy();
                this.isDead = true;
                this.scene.addScore(ThresherEnemy.KILL_SCORE);
            }, 750);
        }

        return true;
    }

    create(scene) {
        this.scene = scene;
        this.sprite = this.scene.physics.add.image(400, 300, this.texref);
        this.sprite.setScale(this.scale[0], this.scale[1]);
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.setAngularVelocity(this.angularVelocity);
        this.lastShot = window.performance.now() + ThresherEnemy.FIRST_SHOT_DELAY;  // wait a second before shooting at the player.
    }

    update() {
        if(this.isDying || this.isDead) {
            return;
        }
        
        let player = this.scene.ship;

        let angle = Math.atan2((this.sprite.y - player.sprite.y), this.sprite.x - player.sprite.x);
        
        let x = Math.cos(angle);
        let y = Math.sin(angle);

        if(this.stunned) {
            this.sprite.setAngularVelocity(-this.angularVelocity);
        }
        else {
            this.sprite.setAngularVelocity(this.angularVelocity);
        }

        let duration = (window.performance.now() - this.lastShot) / 1000.0;
        if(duration > this.shotRate) {
            this.lastShot = window.performance.now();
            let projectile = new Projectile();
            let position = {
                x: this.sprite.x, 
                y: this.sprite.y
            };
            projectile.init({
                type: Projectile.TYPE_SHOT,
                isPlayerOwned: false,
                speed: 33,
                texref: 'particle.red',
                rotation: Math.random() * Math.PI * 2,
                lifetime: 30,
                scene: this.scene,
                position: position
            });
            this.scene.addProjectile(projectile);
        }

        if(this.distance(player.sprite, this.sprite) < this.hitRadius * 1.5) {
            if(player.shield.isActive()) {
                this.stunned = true;
                this.scene.addScore(ThresherEnemy.STUN_SCORE);
                setTimeout(() => {
                    this.stunned = false;
                }, this.stunTimeout);
            }
            else if(this.distance(player.sprite, this.sprite) < this.hitRadius) {
                this.scene.destroyShip();
            }
        }

    }
}

export {ThresherEnemy}

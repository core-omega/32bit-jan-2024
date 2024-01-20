class SpinnerEnemy {
    constructor(config) {
        config = (config) ? config : { };
        this.type = 'spinner';
        this.speed = (config.speed) ? config.speed : 70;
        this.texref = (config.texref) ? config.texref : 'enemy.spinner';
        this.scale = (config.scale) ? config.scale : [0.5, 0.5];
        this.x = (config.x) ? config.x : Math.floor(Math.random() * 720) + 40;
        this.y = (config.y) ? config.y : Math.floor(Math.random() * 280 ) + 20;
        this.hitRadius = (config.hitRadius) ? config.hitRadius : 15;
        this.angularVelocity = (config.angularVelocity) ? config.angularVelocity : 480;
        this.stunned = false;
        this.life = 10;
        this.playDyingAnimation = false;
        this.isDying = false;
        this.isDead = false;

        // change things up a little bit ...
        this.angularVelocity = Math.floor(this.angularVelocity * (0.8 + Math.random() * 0.4));
        this.speed = Math.floor(this.speed * (0.8 + Math.random() * 0.4));
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
            this.emitter = this.scene.add.particles(this.sprite.x, this.sprite.y, this.texref, {
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
    }

    update() {
        if(this.isDying || this.isDead) {
            return;
        }

        let player = this.scene.ship;

        let angle = Math.atan2((this.sprite.y - player.y), this.sprite.x - player.x);
        
        let x = Math.cos(angle);
        let y = Math.sin(angle);

        if(this.stunned) {
            this.sprite.setVelocity(this.speed * x, this.speed * y);
            this.sprite.setAngularVelocity(-this.angularVelocity);
        }
        else {
            this.sprite.setVelocity(-this.speed * x, -this.speed * y);
            this.sprite.setAngularVelocity(this.angularVelocity);
        }

        if(this.distance(player, this.sprite) < this.hitRadius * 1.5) {
            if(player.shield.isActive()) {
                this.stunned = true;
                setTimeout(() => {
                    this.stunned = false;
                }, 1000);
            }
            else if(this.distance(player, this.sprite) < this.hitRadius) {
                this.scene.destroyShip();
            }
        }
    }
}

export {SpinnerEnemy}

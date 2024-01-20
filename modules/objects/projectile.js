class Projectile {
    static TYPE_SHOT = 0;
    static TYPE_BEAM = 1;
    static TYPE_HOMING = 2;

    static SHOT_SPEED_DEFAULT = 500;
    static HOMING_SPEED_DEFAULT = 100;
    static SHOT_LIFE = 3.0;

    constructor() { }
    
    getDefaultSpeed(type) {
        if(type == Projectile.TYPE_SHOT) {
            return Projectile.SHOT_SPEED_DEFAULT;
        }
        if(type == Projectile.TYPE_HOMING) {
            return Projectile.HOMING_SPEED_DEFAULT;
        }

        return 0;
    }

    isAlive() {
        return this.alive;
    }

    init(config) {
        config = (config) ? config : { };
        this.type = (config.type) ? config.type : Projectile.TYPE_SHOT;
        this.isPlayerOwned = (config.isPlayerOwned) ? config.isPlayerOwned : true;
        this.rotation = (config.rotation) ? config.rotation : 0;
        this.rotation += Math.PI / 2;  // because we want top of unit circle = 0
        this.scene = (config.scene) ? config.scene : null;
        this.speed = (config.speed) ? config.speed : this.getDefaultSpeed(this.type);
        // extract x & y from config.position
        this.x = (config.position) ? config.position.x : 0;
        this.y = (config.position) ? config.position.y : 0;
        this.texref = (config.texref) ? config.texref : 'particle.lightblue';

        if(this.scene == null) {
            console.error("NULL scene provided to Projectile - this will fail to update.");
        }

        this.emitter = this.scene.add.particles(this.x, this.y, this.texref, {
            blendMode: 'ADD',
            speed: 50,
            maxAliveParticles: 10,
            lifespan: 50
        });
        this.emitter.x = this.x;
        this.emitter.y = this.y;
        this.poly = this.scene.add.circle(this.x, this.y, 2, 0xefefef);
        this.poly.rotation = this.rotation;

        this.xSpeed = Math.cos(this.poly.rotation - Math.PI) * Projectile.SHOT_SPEED_DEFAULT;
        this.ySpeed = Math.sin(this.poly.rotation - Math.PI) * Projectile.SHOT_SPEED_DEFAULT;
        this.lastUpdate = window.performance.now();
        this.created = window.performance.now();
        this.alive = true;
    }

    update() {
        let lived = (window.performance.now() - this.created) / 1000.0;
        if(lived > Projectile.SHOT_LIFE) {
            this.emitter.destroy();
            this.poly.destroy();
            this.alive = false;
        }
        if(!this.isAlive()) {
            return;
        }
        let duration = (window.performance.now() - this.lastUpdate) / 1000.0;
        this.poly.x += this.xSpeed * duration;
        this.poly.y += this.ySpeed * duration;
        this.emitter.x += this.xSpeed * duration;
        this.emitter.y += this.ySpeed * duration;
        this.lastUpdate = window.performance.now();
    }
}

export {Projectile}
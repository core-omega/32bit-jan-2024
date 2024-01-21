class Projectile {
    static TYPE_SHOT = 0;
    static TYPE_BEAM = 1;
    static TYPE_HOMING = 2;

    static SHOT_HIT_RADIUS = 16;

    static SHOT_SPEED_DEFAULT = 500;
    static HOMING_SPEED_DEFAULT = 100;
    static SHOT_LIFE = 3.0;

    constructor() { }
    
    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + 
                         (p1.y - p2.y) * (p1.y - p2.y));
    }

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

    kill() {
        this.forceKill = true;
    }

    init(config) {
        config = (config) ? config : { };
        this.type = (config.type) ? config.type : Projectile.TYPE_SHOT;
        this.lifetime = (config.lifetime) ? config.lifetime : Projectile.SHOT_LIFE;
        this.isPlayerOwned = (config.isPlayerOwned !== undefined) ? config.isPlayerOwned : true;
        this.rotation = (config.rotation) ? config.rotation : 0;
        this.rotation += Math.PI / 2;  // because we want top of unit circle = 0
        this.scene = (config.scene) ? config.scene : null;
        this.damage = (config.damage) ? config.damage : 5;
        this.speed = (config.speed) ? config.speed : this.getDefaultSpeed(this.type);
        // extract x & y from config.position
        this.x = (config.position) ? config.position.x : 0;
        this.y = (config.position) ? config.position.y : 0;
        this.texref = (config.texref) ? config.texref : 'particle.lightblue';
        this.bouncetexref = (config.bouncetexref) ? config.bouncetexref : 'particle.offwhite';

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

        this.xSpeed = Math.cos(this.poly.rotation - Math.PI) * this.speed;
        this.ySpeed = Math.sin(this.poly.rotation - Math.PI) * this.speed;
        this.lastUpdate = window.performance.now();
        this.created = window.performance.now();
        this.alive = true;
        this.hasHit = false;
        this.forceKill = false;
    }

    update() {
        let lived = (window.performance.now() - this.created) / 1000.0;
        if(lived > this.lifetime || this.hasHit || this.forceKill) {
            this.emitter.destroy();
            this.poly.destroy();
            this.alive = false;
            this.hasHit = false;
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

    checkHits(player, enemies) {
        if(!this.alive) {
            return;
        }

        if(this.isPlayerOwned) {
            for(var i = 0; i < enemies.length; ++i) {
                if(this.distance(this.poly, enemies[i].sprite) < Projectile.SHOT_HIT_RADIUS) {
                    if(enemies[i].onShotHit(this)) {
                        this.hasHit = true;
                    }
                }
            }
        }
        else {
            if(this.distance(this.poly, player.sprite) < Projectile.SHOT_HIT_RADIUS) {
                if(player.shield.isActive()) {
                    this.isPlayerOwned = true;
                    this.xSpeed = -this.xSpeed;
                    this.ySpeed = -this.ySpeed;

                    this.emitter.destroy();
                    this.emitter = this.scene.add.particles(this.poly.x, this.poly.y, this.bouncetexref, {
                        blendMode: 'ADD',
                        speed: 50,
                        maxAliveParticles: 10,
                        lifespan: 50
                    });
                }
                else if(this.scene.onShotHit()) {
                    this.hasHit = true;
                }
            }
        }
    }
}

export {Projectile}
class Shield {
    static SHIELD_DURATION = 0.10;

    constructor(config) {
        config = (config) ? config : { };
        this.drain = (config.drain) ? config.drain : 7;
        this.texref = (config.texref) ? config.texref : "particle.lightblue";
    }

    getDrain() {
        return this.drain;
    }

    create(scene, ship) {
        this.scene = scene;
        this.ship = ship;
        this.active = false;
        this.lastActivation = window.performance.now();
        this.emitter = this.scene.add.particles(100, 100, 'particle.blue', {
            speed: 200,
            frequency: 15,
            lifespan: 100,
            blendMode: 'ADD'
        });
    }

    isActive() {
        return this.active;
    }

    canActivate() {
        if(this.active) {
            return false;
        }
        return this.ship.energy.canUse(this.drain);
    }

    activate() {
        this.active = true;
        this.lastActivation = window.performance.now();
        this.ship.energy.use(this.drain);
        let audio = this.scene.sound.add('sound.shield', {
            volume: 0.2
        });
        audio.play();
    }

    update() {
        this.emitter.x = this.ship.sprite.x;
        this.emitter.y = this.ship.sprite.y;
        let duration = (window.performance.now() - this.lastActivation) / 1000.0;
        if(this.active && duration > Shield.SHIELD_DURATION) {
            this.active = false;
        }
        if(this.active) {
            this.emitter.setQuantity(10);
        }
        else {
            this.emitter.setQuantity(0);
        }
    }
}

export {Shield}
import {GameScene} from '../scenes/game.js'

class GameRoom {
    constructor(config) {
        config = (config) ? config : { };
        this.bgref = (config.bgref) ? config.bgref : this.getRandomBackground();
        this.id = 'Region ' + this.makeId(2) + '-' + this.makeId(4);
        this.exits = [null];
        this.enemies = [];
        this.exitSprites = [];
        this.hasCleared = false;
    }

    isClear() {
        return this.enemies.length == 0;
    }

    makeId(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }

    getRandomBackground() {
        return 'background.stars1';  // random in a sense ...
    }

    addExit(newRoom) {
        if(this.exits.length > 4) {
            console.error("More than four exits in node!");
        }
        this.exits.push(newRoom);
    }

}

class GameMap {
    static MIN_ROOMS = 8;
    static RNG_ROOMS = 8;
    static WORMHOLE_MIN_ACTIVATION_DISTANCE = 75;

    constructor(config) {
        config = (config) ? config : { };
        this.rooms = [];
        this.active = null;
    }

    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + 
                         (p1.y - p2.y) * (p1.y - p2.y));
    }

    createMap() {
        let numRooms = Math.floor(Math.random() * (GameMap.RNG_ROOMS + 1)) + GameMap.MIN_ROOMS;
        let roomIndices = [];
        console.log("[game-map] Creating floor with " + numRooms + " rooms.");
        this.rooms.push(new GameRoom({bgref: 'background.planet'}));
        for(var i = 1; i < numRooms; ++i) {
            this.rooms.push(new GameRoom({}));
            roomIndices.push(i);
        }

        for(var i = 0; i < numRooms; ++i) {
            let a = Math.floor(Math.random()) * numRooms;
            let b = Math.floor(Math.random()) * numRooms;
            let tmp = roomIndices[a];
            roomIndices[a] = roomIndices[b];
            roomIndices[b] = tmp;
        }
        
        for(var i = 0; i < numRooms - 1; ++i) {
            this.rooms[i].exits[0] = this.rooms[roomIndices[i]];
        }

        this.rooms[roomIndices[numRooms - 2]].exits[0] = this.rooms[0];
        this.active = this.rooms[0];
    }

    create(scene) {
        this.createMap();
        this.scene = scene;
        this.background = scene.add.sprite(400, 300, this.active.bgref);
        this.background.setDepth(-1);
        console.log("[game-map] Creating new map.");
        this.wormholeActive = false;
        
        this.regionText = this.scene.add.text(20, 20, this.active.id, {
            fontFamily: 'monospace',
            fontSize: '10px'
        });
    }

    move(newRoom) {
        this.background.destroy();

        this.wormholeActive = false;
        this.scene.setInputLock(false);
        this.scene.ship.setScale(GameScene.SHIP_SCALE, GameScene.SHIP_SCALE);
        this.scene.ship.rotation = 0;
        this.scene.ship.x = 400;
        this.scene.ship.y = 500;

        for(var i = 0; i < 4; ++i) {
            if(this.active.exitSprites[i]) {
                this.active.exitSprites[i].destroy();
            }    
        }

        this.active = newRoom;

        this.background = this.scene.add.sprite(400, 300, this.active.bgref);
        this.background.setDepth(-1);

        if(this.active.isClear()) {
            console.log("[game-map] Room already cleared on entry.");
            this.active.hasCleared = true;
            let index = 0;
            if(this.active.exits[index]) {
                this.active.exitSprites[index] = this.scene.add.sprite(400, 150, 'sprite.wormhole');
                this.active.exitSprites[index].setScale(0.7, 0.7);
                ++index;
            }    
        }

        this.regionText.destroy();
        this.regionText = this.scene.add.text(20, 20, this.active.id, {
            fontFamily: 'monospace',
            fontSize: '10px'
        });
    }

    activateWormhole(whId) {
        console.log("[game-map] Activating wormhole to: " + this.active.exits[whId].id);
        let audio = this.scene.sound.add('sound.wormhole', {
            volume: 1
        });
        audio.play();
        this.wormholeActive = true;
        this.scene.setInputLock(true);
        setTimeout(() => {
            this.move(this.active.exits[whId]);
        }, 2000);
    }

    update() {
        if(this.active.isClear() && !this.active.hasCleared) {
            console.log('[game-map] Room cleared.');
            this.active.hasCleared = true;
            let index = 0;
            if(this.active.exits[index]) {
                this.active.exitSprites[index] = this.scene.add.sprite(400, 150, 'sprite.wormhole');
                this.active.exitSprites[index].setScale(0.7, 0.7);
                ++index;
            }
        }
        if(this.active.isClear()) {
            for(var i = 0; i < this.active.exitSprites.length; ++i) {
                this.active.exitSprites[i].rotation += 0.0005;
            }
        }

        if(this.wormholeActive) {
            this.scene.ship.rotation += 0.2;
            this.scene.ship.setScale(this.scene.ship.scaleX * 0.97, this.scene.ship.scaleY * 0.97);
        }
        else if(this.scene.keyE.isDown) {
            if(this.active.isClear() && !this.wormholeActive) {
                for(var i = 0; i < this.active.exitSprites.length; ++i) {
                    if(this.distance(this.active.exitSprites[i], this.scene.ship) < GameMap.WORMHOLE_MIN_ACTIVATION_DISTANCE) {
                        this.activateWormhole(i);
                    }
                }
            }
        }
    }

}

export {GameMap}
class Gauge {
    //FIXME: in theory, we should break out the numbers from the display ... but whatever, in a hurry.
    constructor(config) {
        config = (config) ? config : { };
        this.max = (config.max) ? config.max : 100;
        this.current = (config.current) ? config.current : this.max;
        this.x = (config.x) ? config.x : 0;
        this.y = (config.y) ? config.y : 0;
        this.count = (config.count) ? config.count : 10;
        this.gaugeSize = (config.gaugeSize) ? config.gaugeSize : 5;    // vertical size per small slice
        this.gaugeWidth = (config.gaugeWidth) ? config.gaugeWidth : 8; // horizontal size per small slice
        this.recharge = (config.recharge) ? config.recharge : 33;      // how quickly does it recharge in units / second
        this.color = (config.color) ? config.color : 0x420042;
        this.stroke = (config.stroke) ? config.stroke : 0x00ff00;
        this.label = (config.label) ? config.label : "";
        this.scene = null;
        this.updateTime = window.performance.now();
        this.display = [];
    }

    available() {
        return this.current;
    }

    canUse(value) {
        return this.current > value;
    }

    use(value) {
        this.current -= value;
        if(this.current < 0) {
            this.current = 0;
        }
    }

    create(scene) {
        this.scene = scene;
        this.updateTime = window.performance.now();
        let height = this.count * this.gaugeSize +(3 * this.count);
        let bottom = this.y - (height / 2);
        for(var i = 0; i < this.count; ++i) {
            let currY = bottom + (i * (this.gaugeSize + 3));
            let rect = this.scene.add.rectangle(this.x, currY, this.gaugeWidth, this.gaugeSize, this.color);
            rect.setStrokeStyle(1, this.stroke);
            this.display.push(rect);
        }
        if(this.label != "") {
            let labelY = this.y - (height / 2) - 15;
            this.scene.add.text(this.x - Math.floor(this.gaugeWidth / 2), labelY, this.label, {
                fontFamily: 'monospace',
                fontSize: '10px'
            });    
        }
    }

    update() {
        let duration = (window.performance.now() - this.updateTime) / 1000.0;
        this.current += this.recharge * duration;
        this.current = (this.current > this.max) ? this.max : this.current;
        let frac = this.max / this.count;
        let full = this.current / this.max;
        let squares = full * frac;
        for(var i = 0; i < this.count; ++i) {
            let index = this.count - i - 1;  // flip so we go bottom-up
            if(i == Math.floor(squares)) {
                let partial = squares - Math.floor(squares);
                this.display[index].setFillStyle(this.color, partial);
                this.display[index].setStrokeStyle(1, this.stroke, partial);
            } else if(i > squares) {
                this.display[index].setFillStyle(this.color, 0.0);
                this.display[index].setStrokeStyle(1, this.stroke, 0.0);
            } else {
                this.display[index].setAlpha(this.color, 1.0);
                this.display[index].setStrokeStyle(1, this.stroke, 1.0);
            }
        }

        this.updateTime = window.performance.now();
    }
}

export {Gauge};

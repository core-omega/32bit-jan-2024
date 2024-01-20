class PerformanceMonitor {
    static PERFORMANCE_UPDATE_FREQ = 5.0;

    constructor() {
        this.last = window.performance.now();
        this.counter = 0;
    }

    update() {
        let duration = (window.performance.now() - this.last) / 1000.0;
        if(duration > PerformanceMonitor.PERFORMANCE_UPDATE_FREQ) {
            document.getElementById('performance').innerHTML = "" + Math.floor(this.counter / duration * 100) / 100.0 + " updates / second";
            this.last = window.performance.now();
            this.counter = 0;
        }
        this.counter ++;
    }
}

let monitor = new PerformanceMonitor();

function GetPerformanceMonitor() {
    return monitor;
}

export {GetPerformanceMonitor}
//const _ = require('lodash');
const color = require('color');
var EventEmitter = require('events');

var config;

class animation extends EventEmitter {
    constructor()  {
        super();

        this.config = config;

        this.name = "animation";
        this.col = col;
        this.speed = speed;
        this.times = times;

        this.running = false;
    }

    start() {
        console.log('animation: "' + this.name + '" is starting');
        this.running = true;
        this.emit('started');
    }

    pause() {
        console.log('animation: "' + this.name + '" paused');
        this.running = false;
        this.emit('paused');
    }

    resume() {
        console.log('animation: "' + this.name + '" resumed');
        this.running = false;
        this.emit('resume');
    }

    stop() {
        console.log('animation: "' + this.name + '" stopped');
        this.emit('finished');
    }
}

module.exports = function(conf) {
    config = conf;
    return animation;
}
const animation = require('./animation');

const pulse = require('./pulse');

var exports;

module.exports = {
    animation : animation,
    pulse : pulse
}

function animations(config) {
    this.config = config;
    this.animation = animation(config);
    this.pulse = pulse;
}
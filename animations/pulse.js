var animation = require('./animation');
var config;

class pulse extends animation {
    constructor(obj) {
        this.name = "pulse";
        this.start();
    }

    start() {
        super.start();

        var self = this;
        var step = 0.05;
        var total_iterations = 0;

        speed      = speed || 10; // ms
        iterations = iterations || 99999;

        var level = 0.00;
        var dir   = step;

        function performStep() {
            if (level <= 0.0) {
                level = 0.0;
                dir = step;
                total_iterations++;
            } else if (level >= 1.0) {
                level = 1.0;
                dir = -step;
            }

            level += dir;

            if (level < 0.0) {
                level = 0.0;
            } else if (level > 1.0) {
                level = 1.0;
            }

            if (self.stopAnimationRequest || total_iterations > iterations) {
                self.stopAnimation();
                return;
            }
	
	    if (self.type == 'ws2801') {
		self.leds.fill(r * level,g * level,b * level);
	    }
	    else if (self.type == 'lpd8806') {
                self.leds.setMasterBrightness(level);
                self.leds.fillRGB([r * level,g * level,b * level]);
	    }

            setTimeout(performStep, speed);
        }

        if (this.leds) {
            performStep();
        }
    }
}

module.exports = pulse;
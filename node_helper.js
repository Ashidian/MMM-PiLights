/* global require */

const _ = require('lodash');
const Color = require('color');
const NodeHelper = require('node_helper');
const bodyParser = require('body-parser');
//const LPD8806 = require('lpd8806-async');
//const WS2801	 = require('rpi-ws2801');
const async = require('async');

var ajv = require('ajv')({
    allErrors: true,
    format: 'full',
    coerceTypes: true
});

module.exports = NodeHelper.create({

    config: {},
    animationRunning: false,
    stopAnimationRequest: false,
    defaultSpeed: 100,
    type: 'ws2801'

    /**
     * node_helper start method
     */
    start: function () {
        console.log('[PiLights] Starting node_helper');

        this.expressApp.use(bodyParser.json());
        this.expressApp.use(bodyParser.urlencoded({ extended: true }));

        this.expressApp.get('/PiLights', (req, res) => {
            console.error('[PiLights] Incoming:', req.query);

            if (typeof req.query.sequence !== 'undefined') {
                // Sequence

                this.runSequence(req.query.sequence)
                    .then(function () {
                        res.status(200)
                            .send({
                                status: 200
                            });
                    })
                    .catch(function (err) {
                        res.status(400)
                            .send({
                                status: 400,
                                error: err.message
                            });
                    });
	    } else if (typeof req.query.r !== 'undefined' ||
		       typeof req.query.g !== 'undefined' ||
		       typeof req.query.b !== 'undefined') {
		    r = Number(req.query.r) || 0;
		    g = Number(req.query.g) || 0;
		    b = Number(req.query.b) || 0;
		    console.error(r + " " + g + " " + b);
		    if (typeof req.query.id !== 'undefined') {
			id = Number(req.query.id) || 0;
			this.leds.setColor(id, [r,g,b]);
			this.leds.update();
		    }
		    else
		    {
			this.leds.fill(r,g,b);
		    }
                        res.status(200)
                            .send({
                                status: 200
                            });
	    } else if (typeof req.query.stop !== 'undefined') {
		this.off();
                        res.status(200)
                            .send({
                                status: 200
                            });
	    } else {
                res.status(400)
                    .send({
                        status: 400,
                        error: 'Sequence not specified'
                    });
            }

        });
    },

    /**
     *
     * @param {String} notification
     * @param {*}      payload
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === 'START') {
            this.config = payload;

            try {
                console.info('Trying to load leds');
		this.type = this.config.type;
		if (this.type == 'ws2801') {
			// Internal reference to rpi-ws2801
			this.leds = require("rpi-ws2801");
			this.leds.connect(this.config.ledCount, this.config.device);
			// Initialize off
			this.leds.clear();
		}
		else if (this.type == 'lpd8806') {
			// Internal reference to lpd8806-async
			var LPD8806 = require('lpd8806-async');
			this.leds = new LPD8806(this.config.ledCount, this.config.device);

			// Initialize off
			this.leds.allOFF();
			this.leds.setMasterBrightness(this.config.brightness);
		}

                //this.leds.setMasterBrightness(this.config.brightness);

                console.log('[PiLights] Leds connected ok');

            } catch (err) {
                console.error('[PiLights] Unable to open SPI (' + this.config.device + '), not supported?', err.message);
                this.leds = null;
            }

        } else if (notification === 'SEQUENCE') {
            Promise.resolve(this.runSequence(payload)
                .catch(function (err) {
                    console.log('[PiLights] Sequence error: ' + err.message);
                }));
        } else if (notification === 'SEQUENCE2') {
            Promise.resolve(this.runSequence(payload)
                .catch(function (err) {
                    console.log('[PiLights] Sequence error: ' + err.message);
                }));
        }
    },

    /**
     * Runs a light sequence
     *
     * @param   {String}  sequence
     * @param   {Integer} [iterations]
     * @returns {Promise}
     */
    runSequence: function (sequence, iterations) {
        var self = this;
        iterations = iterations || 10;

        return new Promise(function (resolve, reject) {
            var colors = [0, 0, 0];

            switch (sequence) {
                case 'blue_pulse':
                    colors = [0, 0, 255];
                    break;
                case 'white_pulse':
                    colors = [255, 255, 255];
                    break;
                case 'lightblue_pulse':
                    colors = [0, 255, 255];
                    break;
                case 'red_pulse':
                    colors = [255, 0, 0];
                    break;
                case 'green_pulse':
                    colors = [0, 255, 0];
                    break;
                case 'orange_pulse':
                    colors = [255, 170, 0];
                    break;
                case 'pink_pulse':
                    colors = [255, 0, 255];
                    break;
                default:
                    reject(new Error('Unknown sequence: ' + sequence));
                    return;
                    break;
            }
            resolve(self.pulse(colors[0], colors[1], colors[2], iterations, 100));

        });
    },

    /**
     * @param {Function} cb
     * @returns {*}
     */
    switchAnimation: function (cb) {
        if (!this.animationRunning) {
            return this.startAnimation(cb);
        }

        this.stopAnimationRequest = true;

        if (this.animationRunning) {
            //console.log('animation was running, delaying new animation');

            var self = this;
            setTimeout(function () {
                self.switchAnimation(cb);
            }, 100);
        } else {
            this.startAnimation(cb);
        }
    },

    /**
     *
     * @param {Function} cb
     * @returns {Function}
     */
    startAnimation: function (cb) {
        //console.log('[PiLights] Starting animation..');
        this.stopAnimationRequest = false;
        this.animationRunning = true;
        return cb();
    },

    /**
     *
     */
    stopAnimation: function () {
        //console.log('[PiLights] Animation stopped.');
	this.stopAnimationRequest = true;
        this.animationRunning = false;
    },

    /**
     *
     */
    update: function () {
        //        if (this.leds) {
        //           this.leds.update();
        //        }
    },

    /**
     *
     * @param {Integer} red
     * @param {Integer} green
     * @param {Integer} blue
     * @param {Integer} [iterations]
     * @param {Integer} [speed]
     */
    pulse: function (red, green, blue, iterations, speed) {
        if (this.leds) {
            this.switchAnimation(() => {
                console.log('[PiLights] Pulse (' + red + ',' + green + ', ' + blue + ') Iterations: ' + iterations + ', Speed: ' + speed);
                this.flashEffect(red, green, blue, iterations, speed);
            });
        }
    },

    /**
     *
     * @param r
     * @param g
     * @param b
     */
    fillRGB: function (r, g, b) {
        if (this.leds) {
            this.switchAnimation(() => {
		this.stopAnimation();
                //console.log('[PiLights] Filling leds with', r, g, b);
		if (this.type == 'ws2801')
		{
                    this.leds.fill(r, g, b);
		}
		else if (this.type == 'lpd8806')
		{
		    this.leds.fillRGB(r, g, b);
		}
            });
        }
    },

    /**
     *
     */
    off: function () {
        if (this.leds) {
            //console.log('[PiLights] Setting Leds Off');
	    this.stopAnimation();
	    if (this.type == 'ws2801')
	    {
            	this.leds.clear();
	    }
	    else if (this.type == 'lpd8806')
	    {
		this.leds.allOFF();
	    }
        }
    },

    /**
     *
     * @param {Integer} r
     * @param {Integer} g
     * @param {Integer} b
     * @param {Integer} [iterations]
     * @param {Integer} [speed]
     */
    flashEffect: function (r, g, b, iterations, speed) {
        var self = this;
        var step = 0.05;
        var total_iterations = 0;

        speed = speed || 1000; // ms
        iterations = iterations || 99999;

        var level = 0.00;
        var dir = step;

        function performStep() {
	    console.log('performStep');
            if (level = 1.0) {
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
	    
	    if (this.type == 'ws2801') {
                self.leds.fill(r * level, b * level, g * level);
	    }
	    else if (this.type == 'lpd8806') {
		self.leds.fillRGB(r * level, b * level, g * level);
	    }


            setTimeout(performStep, speed);
        }

        if (this.leds) {
            performStep();
        }
    }

});

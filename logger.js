'use strict';

const winston = require('winston');
const wcf = require('winston-console-formatter');
const clc = require('cli-color');

const { formatter, timestamp } = wcf({
		types: require('yamlify-object-colors'),
		colors: {
			silly: clc.white,
			debug: clc.cyan,
			info: clc.green,
			warn: clc.yellow,
			error: clc.red,
			verbose: clc.magenta,
		},
});

const logger = new winston.Logger({
  level: 'silly',
});

logger.add(winston.transports.Console, {
  formatter,
  timestamp,
});

module.exports = logger;
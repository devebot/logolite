var logolite = require('../../index');
var LogAdapter = logolite.LogAdapter;
var LogTracer = logolite.LogTracer;
var LogHelper = logolite.LogHelper;

var winston = require('winston');
LogAdapter.connectTo(new winston.Logger({
	transports: [
		new winston.transports.Console({
			level: 'debug',
			json: false,
			timestamp: true,
			colorize: true
		})
	]
}));

// create a logger
var logger = LogAdapter.getLogger();

var appTracer = LogTracer.ROOT.branch({
	key: 'appId',
	value: LogHelper.getLogID()
});

console.log(' ... your code here ... ');

// .add() a map (key/value), .put() a single field (key, value)
logger.log('info', appTracer
	.add({
		message: 'app level logging message',
		dataInt: 123,
		dataBoolean: true,
		dataObject: { key1: 'value 1', key2: 'value 2' },
		dataString: 'simple string'
	})
	.put('singleField', 'put a single key/value')
	.put('anotherField', 1024)
	.toMessage({reset: true}));

console.log(' ... your code here ... ');

// create a child tracer object
var appSubLevel = appTracer.branch({
	key: 'sublevel',
	value: LogHelper.getLogID()
});

logger.log('debug', appSubLevel.add({
		message: 'message 1'
	}).toMessage());

logger.log('debug', appSubLevel.add({
		message: 'message 2'
	}).toMessage());

console.log(' ... your code here ... ');

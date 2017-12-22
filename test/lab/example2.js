var logolite = require('../../index');
var LogAdapter = logolite.LogAdapter;
var LogTracer = logolite.LogTracer;

// create a logger
var logger = LogAdapter.getLogger();

var appTracer = LogTracer.ROOT.branch({
	key: 'appId',
	value: LogTracer.getLogID()
});

console.log(' ... your code here ... ');

logger.has('conlog') && logger.log('conlog', appTracer
	.add({
		message: 'app level logging message',
		dataInt: 123,
		dataBoolean: true,
		dataObject: { key1: 'value 1', key2: 'value 2' },
		dataString: 'simple string'
	})
	.put('singleField', 'put a single key/value')
	.put('anotherField', 1024)
	.toMessage({
		template: 'Integer: {dataInt} and string: {dataString}.',
		reset: true
	}));


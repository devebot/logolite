# logolite

> Lite Virtual Logger and Tracer

## How to use it?

Create a `logger` object:

```javascript
var LogAdapter = require('logolite').LogAdapter;

// connect to a logger instance (winston)
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

/*
// or a bunyan logger instance instead
var bunyan = require('bunyan');
LogAdapter.connectTo(bunyan.createLogger({
	name: 'myApplication',
	level: 'debug'
}));
*/

/*
// or a log4js logger instance
var log4js = require('log4js');
var log4jsLogger = log4js.getLogger();
log4jsLogger.level = 'debug';
LogAdapter.connectTo(log4jsLogger);
*/

// create a logger
var logger = LogAdapter.getLogger();
```

Create a LogTracer object and put message and loginfo into it:

```javascript
var LogTracer = require('logolite').LogTracer;

var appTracer = LogTracer.ROOT.branch({
	key: 'appId',
	value: LogTracer.getLogID()
});

// ... your code here ...

// .has() is an alias of .isEnabledFor() method;
// .add() a map (key/value), .put() a single field (key, value)
logger.has('info') && logger.log('info', appTracer
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

// ... your code here ...

// create a child tracer object
var subLevel = appTracer.branch({
	key: 'subLevel',
	value: LogTracer.getLogID()
});

logger.has('debug') && logger.log('debug', subLevel
	.add({
		name: 'Foo',
		percent: 51
	})
	.toMessage({
		text: '{percent}% completed...'
	}));

logger.has('debug') && logger.log('debug', subLevel
	.add({
		name: 'Foo',
		percent: 100
	})
	.toMessage({
		text: '{percent}% completed. The task "{name}" has done.'
	}));

// ... your code here ...
```

## Environment variables

* `LOGOLITE_INSTANCE_ID`: (UUID string) instance ID of runtime;
* `LOGOLITE_INFO_MESSAGE`: (string) Value of `message` field in libraryInfo logging object (default: "Application Information");
* `LOGOLITE_DEFAULT_SECTOR`: (string) default sector name for `debug` module (default: logolite-default, to display this sector: DEBUG=`logolite*,other*`);
* `LOGOLITE_ALWAYS_ENABLED`: (string) the list of levels that are always enabled (default: none, "all" for all);
* `LOGOLITE_AUTO_DETECT_FOR`: ("bunyan"|"winston") detects for default `bunyan` or `winston` logging engine (default: none);
* `LOGOLITE_DEBUGLOG_NAME`: (string) the name for debug logging level (default: `conlog`);
* `LOGOLITE_DEBUGLOG`: (true/false) forces using `debug` module to render logging message (default: false);
* `LOGOLITE_FORMATTING_ENABLED`: (true/false) enable/disable format logging object by template string (default: true);
* LOGOLITE_INTERCEPTOR_ENABLED: (true/false) enable/disable interception mode (default: true);
* `LOGOLITE_STRINGIFY_DISABLED`: (true/false) turns off stringify logging message when call toMessage() method (default: false);
* `LOGOLITE_STRINGIFY_PROTECTED`: (true/false) run JSON.stringify() inside try...catch block (default: true);
* `LOGOLITE_BASE64_UUID`: (true/false) enable/disable base64 UUID format (default true);

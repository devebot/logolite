# logolite

> Lite Logging Adapter

## How to use it?

Create a `logger` object:

```javascript
var LogAdapter = require('logolite').LogAdapter;

// connect to your logger instance
var winston = require('winston');
LogAdapter.connectTo(winston);

// create the logger
var logger = LogAdapter.getLogger();
```

Create logging tracers and put message and loginfo into it:

```
var LogTracer = require('logolite').LogTracer;
var LogHelper = require('logolite').LogHelper;

var appTracer = LogTracer.ROOT.branch({
	key: 'appId',
	value: LogHelper.getLogID()
});

// ... code here ...

// .add() a map (key/value), .put() a single field (key, value)
logger.log(appTracer
	.add({
		message: 'app level logging message',
		dataInt: 123,
		dataBoolean: true,
		dataObject: { key1: 'value 1', key2: 'value 2' },
		dataString: 'simple string'
	})
	.put('singleField', 'put a single key/value')
	.put('anotherField', 1024)
	.stringify({reset: true}));

// ... code here ...

// create a child tracer object
var appSubLevel = appTracer.branch({
	key: 'sublevel',
	value: LogHelper.getLogID()
});

logger.log(appSubLevel.add({
		message: 'message 1'
	}).stringify());

logger.log(appSubLevel.add({
		message: 'message 2'
	}).stringify());

// ... code here ...
```

## Environment variables

* `LOGOLITE_INSTANCE_ID`: (UUID string) instance ID of runtime;
* `LOGOLITE_INFO_MESSAGE`: (string) Value of `message` field in libraryInfo logging object (default: "Application Information");
* `LOGOLITE_DEFAULT_SCOPE`: (string) default scope for `debug` module (DEBUG=`debug_scopes`);
* `LOGOLITE_MAXLEVEL`: (string) the maximum level that will be displayed;
* `LOGOLITE_DEBUGLOG`: (true/false) forces using `debug` module to render logging message (default: false);
* `LOGOLITE_SAFE_STRINGIFY`: (true/false) run JSON.stringify() inside try...catch block (default true);
* `LOGOLITE_BASE64_UUID`: (true/false) enable/disable base64 UUID format (default true);


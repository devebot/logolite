'use strict';

var logolite = global.logolite = global.logolite || {};

logolite.LogAdapter = require('./adapter');
logolite.LogTracer = require('./tracer');
logolite.LogConfig = require('./config');
logolite.MockLogger = require('./logmock');

module.exports = logolite;

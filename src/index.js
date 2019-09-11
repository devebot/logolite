'use strict';

const logolite = global.logolite = global.logolite || {};

logolite.LogAdapter = require('./adapter');
logolite.LogTracer = require('./tracer');
logolite.LogConfig = require('./config');
logolite.LogFormat = require('./format');
logolite.MockLogger = require('./logmock');

module.exports = logolite;

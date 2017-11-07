'use strict';

var debug = require('debug');
var misc = require('./util');
var LOG_LEVELS = ['none', 'fatal', 'error', 'warn', 'info', 'debug', 'trace', 'conlog'];

var Logger = function(kwargs) {
  var self = this;
  var debugLog = debug(kwargs.scope || misc.DEFAULT_SCOPE);

  self.isEnabledFor = function(level) {
    var realLogger = kwargs.store.realLogger;
    if (misc.MAX_LOG_LEVEL) {
      return LOG_LEVELS.indexOf(misc.MAX_LOG_LEVEL) >= LOG_LEVELS.indexOf(level);
    }
    if (misc.IS_DEBUGLOG || level === 'conlog') return debugLog.enabled;
    return realLogger != null && realLogger[level] !== undefined;
  }

  self.log = function(level) {
    var realLogger = kwargs.store.realLogger;
    if (misc.IS_DEBUGLOG || level === 'conlog') {
      var logargs = Array.prototype.slice.call(arguments, 1);
      debugLog.apply(null, logargs);
      return;
    }
    if (realLogger) {
      if (typeof(realLogger.log) === 'function') {
        realLogger.log.apply(realLogger, arguments);
      } else if (typeof(realLogger[level]) === 'function') {
        var logargs = Array.prototype.slice.call(arguments, 1);
        realLogger[level].apply(realLogger, logargs);
      }
    }
  }
}

var detector = function() {
  try {
    var winston = require('winston');
    winston.configure({
      transports: [
        new winston.transports.Console({
          level: 'debug',
          json: false,
          timestamp: true,
          colorize: true
        })
      ]
    });
    return winston;
  } catch(err) {
    return null;
  }
};

var LogAdapter = function() {
  var store = { realLogger: null };

  this.getLogger = function(kwargs) {
    kwargs = kwargs || {};
    kwargs.store = store;
    return new Logger(kwargs);
  }

  this.connectTo = function(logger) {
    if (logger) {
      store.realLogger = logger;
    }
    var LX = this.getLogger();
    LX.log('info', misc.libraryInfoString);
  }

  this.connectTo(detector());
}

module.exports = new LogAdapter();

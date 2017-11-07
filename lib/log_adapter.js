'use strict';

var debug = require('debug');
var misc = require('./log_helper');

var Logger = function(kwargs) {
  var self = this;
  var debugLog = debug(kwargs.scope || misc.DEFAULT_SCOPE);

  self.isEnabledFor = function(level) {
    var realLogger = kwargs.store.realLogger;
    if (misc.isAlwaysEnabledFor(level)) return true;
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

var detectDefaultLogger = function() {
  switch(misc.AUTO_DETECT_FOR) {
    case 'bunyan':
      try {
        var bunyan = require('bunyan');
        var logger = bunyan.createLogger({
          name: 'logolite',
          level: 'debug'
        });
        return logger;
      } catch(err) {
        return null;
      }
      break;
    case 'winston':
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
      break;
    default:
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

  misc.AUTO_DETECT && this.connectTo(detectDefaultLogger());
}

module.exports = new LogAdapter();

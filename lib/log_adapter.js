'use strict';

var debug = require('debug');
var LogConfig = require('./log_config');
var LogTracer = require('./log_tracer');

var Logger = function(kwargs) {
  var self = this;
  var debugLog = debug(kwargs.scope || LogConfig.DEFAULT_SCOPE);

  self.isEnabledFor = function(level) {
    var realLogger = kwargs.store.realLogger;
    if (LogConfig.isAlwaysEnabledFor(level)) return true;
    if (LogConfig.IS_DEBUGLOG || level === 'conlog') return debugLog.enabled;
    return realLogger != null && realLogger[level] !== undefined;
  }

  self.log = function(level) {
    var realLogger = kwargs.store.realLogger;
    if (LogConfig.IS_DEBUGLOG || level === 'conlog') {
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
  switch(LogConfig.AUTO_DETECT_FOR) {
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
    LX.log('info', LogTracer.ROOT.add(LogConfig.libraryInfo).toMessage({reset: true}));
  }

  this.connectTo(detectDefaultLogger());
}

module.exports = new LogAdapter();

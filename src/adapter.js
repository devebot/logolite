'use strict';

var debug = require('debug');
var LogConfig = require('./config');
var LogTracer = require('./tracer');
var MockLogger = require('./logmock');

var Logger = function(kwargs) {
  kwargs = kwargs || {};
  var self = this;
  var debugLog = null;

  var createDebugLogger = function() {
    return debug(kwargs.sector || kwargs.scope || LogConfig.DEFAULT_SECTOR);
  }

  var isDebugLog = function(level) {
    return LogConfig.IS_DEBUGLOG_ENABLED || kwargs.target === 'conlog' ||
        LogConfig.DEBUGLOG_NAME === level ||
        LogConfig.DEBUGLOG_NAMES.indexOf(level) >= 0;
  }

  self.has = function(level) {
    var realLevel = kwargs.mappings && kwargs.mappings[level] || level;
    if (LogConfig.isAlwaysEnabledFor(realLevel)) return true;
    if (isDebugLog(realLevel)) {
      debugLog = debugLog || createDebugLogger();
      return debugLog.enabled;
    }
    var rootLogger = kwargs.store.rootLogger;
    if (rootLogger && typeof(rootLogger.has) === 'function') {
      return rootLogger.has(realLevel);
    }
    return rootLogger != null && rootLogger[realLevel] !== undefined;
  }

  self.log = function(level) {
    var realLevel = kwargs.mappings && kwargs.mappings[level] || level;
    if (!LogConfig.isAlwaysMutedFor(realLevel)) {
      if (isDebugLog(realLevel)) {
        var logargs = Array.prototype.slice.call(arguments, 1);
        debugLog = debugLog || createDebugLogger();
        debugLog.apply(null, logargs);
        return;
      }
      var rootLogger = kwargs.store.rootLogger;
      if (rootLogger) {
        if (typeof(rootLogger.log) === 'function') {
          if (realLevel !== level) arguments[0] = realLevel;
          rootLogger.log.apply(rootLogger, arguments);
        } else if (typeof(rootLogger[realLevel]) === 'function') {
          var logargs = Array.prototype.slice.call(arguments, 1);
          rootLogger[realLevel].apply(rootLogger, logargs);
        }
      }
    }
    var realArgs = arguments;
    if (realLevel !== level) realArgs[0] = realLevel;
    kwargs.store.interceptors.forEach(function(logger) {
      logger.log.apply(logger, realArgs);
    });
  }

  // @Deprecated
  self.isEnabledFor = self.has;
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
    case 'log4js':
      try {
        var log4js = require('log4js');
        var log4jsLogger = log4js.getLogger();
        log4jsLogger.level = 'debug';
        return log4jsLogger;
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
  var store = { rootLogger: null, isInfoSent: false, interceptors: [] };
  var mockLogger = null;

  this.getLogger = function(kwargs) {
    kwargs = kwargs || {};
    kwargs.store = store;
    return new Logger(kwargs);
  }

  this.getRootLogger = function() {
    return store && store.rootLogger;
  }

  this.addInterceptor = function(logger) {
    if (_isLogger(logger)) {
      store.interceptors.push(logger);
    }
    return this;
  }

  this.removeInterceptor = function(logger) {
    var pos = store.interceptors.indexOf(logger);
    if (pos >= 0) {
        store.interceptors.splice(pos, 1);
    }
    return this;
  }

  this.clearInterceptors = function() {
    store.interceptors.length = 0;
    return this;
  }

  this.countInterceptors = function() {
    return store.interceptors.length;
  }

  this.connectTo = function(logger, levelToTick) {
    // @Deprecated
    if (LogConfig.IS_MOCKLOGGER_ENABLED) {
      logger = mockLogger = mockLogger || new MockLogger({
        level: 'all'
      });
    }
    var changed = (logger && (logger !== store.rootLogger));
    if (changed) {
      store.rootLogger = logger;
    }
    if (changed || !store.isInfoSent) {
      levelToTick = levelToTick || 'info';
      this.getLogger().log(levelToTick, LogTracer.ROOT
          .add(LogConfig.libraryInfo)
          .toMessage({ tags: ['logolite-metadata'], reset: true }));
      store.isInfoSent = true;
    }
  }

  this.connectTo(detectDefaultLogger());

  var _isLogger = function(logger) {
    return logger && (typeof logger.log === 'function');
  }
}

module.exports = new LogAdapter();

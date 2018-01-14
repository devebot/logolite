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
    return LogConfig.IS_DEBUGLOG || kwargs.target === 'conlog' ||
        LogConfig.DEBUGLOG_NAME === level ||
        LogConfig.DEBUGLOG_NAMES.indexOf(level) >= 0;
  }

  self.has = function(level) {
    if (LogConfig.isAlwaysEnabledFor(level)) return true;
    if (isDebugLog(level)) {
      debugLog = debugLog || createDebugLogger();
      return debugLog.enabled;
    }
    var rootLevel = kwargs.mappings && kwargs.mappings[level] || level;
    var rootLogger = kwargs.store.rootLogger;
    return rootLogger != null && rootLogger[rootLevel] !== undefined;
  }

  self.log = function(level) {
    if (isDebugLog(level)) {
      var logargs = Array.prototype.slice.call(arguments, 1);
      debugLog = debugLog || createDebugLogger();
      debugLog.apply(null, logargs);
      return;
    }
    var rootLevel = kwargs.mappings && kwargs.mappings[level] || level;
    var rootLogger = kwargs.store.rootLogger;
    if (rootLogger) {
      if (typeof(rootLogger.log) === 'function') {
        if (rootLevel !== level) arguments[0] = rootLevel;
        rootLogger.log.apply(rootLogger, arguments);
      } else if (typeof(rootLogger[rootLevel]) === 'function') {
        var logargs = Array.prototype.slice.call(arguments, 1);
        rootLogger[rootLevel].apply(rootLogger, logargs);
      }
    }
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
  var store = { rootLogger: null, isInfoSent: false };
  var mockLogger = null;

  this.getLogger = function(kwargs) {
    kwargs = kwargs || {};
    kwargs.store = store;
    return new Logger(kwargs);
  }

  this.getRootLogger = function() {
    return store && store.rootLogger;
  }

  this.connectTo = function(logger, levelToTick) {
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
}

module.exports = new LogAdapter();

'use strict';

const debug = require('debug');
const LogConfig = require('./config');
const LogTracer = require('./tracer');
const MockLogger = require('./logmock');

function Logger (kwargs) {
  kwargs = kwargs || {};

  let debugLog = null;

  let createDebugLogger = function() {
    return debug(kwargs.sector || kwargs.scope || LogConfig.DEFAULT_SECTOR);
  }

  let isDebugLog = function(level) {
    return kwargs.target === 'conlog' ||
        LogConfig.IS_DEBUGLOG_ENABLED ||
        LogConfig.DEBUGLOG_NAMES.indexOf('all') >= 0 ||
        LogConfig.DEBUGLOG_NAMES.indexOf(level) >= 0;
  }

  this.has = function(level) {
    let realLevel = kwargs.mappings && kwargs.mappings[level] || level;
    if (LogConfig.isAlwaysEnabledFor(realLevel)) return true;
    if (isDebugLog(realLevel)) {
      debugLog = debugLog || createDebugLogger();
      return debugLog.enabled;
    }
    let rootLogger = kwargs.store.rootLogger;
    if (rootLogger && typeof(rootLogger.has) === 'function') {
      return rootLogger.has(realLevel);
    }
    return rootLogger != null && rootLogger[realLevel] !== undefined;
  }

  this.log = function(level) {
    let realLevel = kwargs.mappings && kwargs.mappings[level] || level;
    if (!LogConfig.isAlwaysMutedFor(realLevel)) {
      if (isDebugLog(realLevel)) {
        let logargs = Array.prototype.slice.call(arguments, 1);
        debugLog = debugLog || createDebugLogger();
        debugLog.apply(null, logargs);
        return;
      }
      let rootLogger = kwargs.store.rootLogger;
      if (rootLogger) {
        if (typeof(rootLogger.log) === 'function') {
          if (realLevel !== level) arguments[0] = realLevel;
          rootLogger.log.apply(rootLogger, arguments);
        } else if (typeof(rootLogger[realLevel]) === 'function') {
          let logargs = Array.prototype.slice.call(arguments, 1);
          rootLogger[realLevel].apply(rootLogger, logargs);
        }
      }
    }
    if (kwargs.store.interceptors.length > 0) {
      let realArgs = arguments;
      if (realLevel !== level) realArgs[0] = realLevel;
      kwargs.store.interceptors.forEach(function(logger) {
        logger.log.apply(logger, realArgs);
      });
    }
  }
}

let LogAdapter = function() {
  let store = { rootLogger: null, isInfoSent: false, interceptors: [] };
  let mockLogger = null;

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
    let pos = store.interceptors.indexOf(logger);
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

  this.connectTo = function(logger, opts) {
    // @Deprecated
    if (LogConfig.IS_MOCKLOGGER_ENABLED) {
      logger = mockLogger = mockLogger || new MockLogger({
        level: 'all'
      });
    }
    let changed = (logger && (logger !== store.rootLogger));
    if (changed) {
      store.rootLogger = logger;
    }
    if (changed || !store.isInfoSent) {
      if (typeof opts === 'string') {
        opts = { onLevel: opts }
      }
      opts = opts || {};
      opts.onLevel = opts.onLevel || 'info';
      this.getLogger({ mappings: opts.mappings }).log(opts.onLevel, LogTracer.ROOT
          .add(LogConfig.libraryInfo)
          .toMessage({ tags: ['logolite-metadata'], reset: true }));
      store.isInfoSent = true;
    }
  }

  this.reset = function() {
    Object.keys(store).forEach(function(field) {
      if (field === 'rootLogger') {
        store[field] = null;
      } else
      if (field === 'isInfoSent') {
        store[field] = false;
      } else
      if (field === 'interceptors') {
        store[field].length = 0;
      } else {
        delete store[field];
      }
    });
    return this;
  }

  // this.connectTo(null);

  let _isLogger = function(logger) {
    return logger && (typeof logger.log === 'function');
  }
}

module.exports = new LogAdapter();

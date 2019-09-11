'use strict';

const LogConfig = require('./config');
const util = require('util');
const dbg = require('debug')('logolite:logmock');

function MockLogger (params) {
  params = params || {};
  params.action = params.action || 'cache';

  const self = this;

  let _logLevelMap = null;
  let _logLevels = null;
  let _logPosition = -1;
  let _cachedMessages = [];

  this.log = function(level) {
    if (_isEnabledFor(level)) {
      switch (params.action) {
        case 'cache': {
          _cachedMessages.push(arguments);
          break;
        }
        case 'print': {
          let args = Array.prototype.slice.call(arguments, 1);
          let str = util.format.apply(util, args);
          console.log(new Date().toISOString() + ' [' + level + '] ' + str);
          break;
        }
      }
    }
  }

  this.has = function (level) {
    return _isEnabledFor(level);
  }

  this._alter = function(opts) {
    opts = opts || {};

    if (opts.levels && typeof(opts.levels) === 'object') {
      // clear the old methods
      if (_logLevels instanceof Array) {
        _logLevels.forEach(function(logLevel) {
          delete self[logLevel];
        });
      }

      // set the new levels
      _logLevelMap = opts.levels;
      dbg.enabled && dbg('_logLevelMap: %s', JSON.stringify(_logLevelMap));

      _logLevels = LogConfig.sortLevels(_logLevelMap).map(function(item) {
        return item.key;
      });
      dbg.enabled && dbg('_logLevels: %s', JSON.stringify(_logLevels));

      // define the new methods
      _logLevels.forEach(function(logLevel) {
        self[logLevel] = self.log.bind(self, logLevel);
      });

      // default logging level: all
      _logPosition = _logLevels.length - 1;
    }

    let level = opts.level || opts.logLevel;
    if (level && _logLevels.indexOf(level) >= 0) {
      _logPosition = _logLevels.indexOf(level);
    }
    if (level == 'all') {
      _logPosition = _logLevels.length - 1;
    }
    dbg.enabled && dbg('_logPosition: %s/%s', _logPosition, level);
    return this;
  }

  this._probe = function() {
    return _cachedMessages.slice().map(function(item) {
      item = item || [];
      return { severity: item[0], payload: item[1] }
    });
  }

  this._reset = function() {
    let store = this._probe();
    _cachedMessages.length = 0;
    return store;
  }

  let _isEnabledFor = function(level) {
    let p = _logLevels.indexOf(level);
    dbg.enabled && dbg('_isEnabledFor: %s/%s/%s', level, p, _logPosition);
    return (p >= 0) && (p <= _logPosition);
  }

  Object.defineProperty(this, 'messages', {
    get: function() { return _cachedMessages.slice() },
    set: function(val) {}
  });

  params.logLevel = params.logLevel || params.level || 'all';
  params.levels = params.levels || {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
    verbose: 5
  };
  this._alter(params);
}

module.exports = MockLogger;

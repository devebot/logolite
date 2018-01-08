'use strict';

var LogConfig = require('./config');
var debugx = require('debug')('logolite:MockLogger');

var MockLogger = function(params) {
	params = params || {};

	var self = this;
	var _logLevelMap = null;
	var _logLevels = null;
	var _logPosition = -1;
	var _cachedMessages = [];

	this.log = function(level) {
		if (_isEnabledFor(level)) {
			_cachedMessages.push(arguments);
		}
	}

	this._alter = function(opts) {
		opts = opts || {};

		if (opts.levels && typeof(opts.levels) === 'object') {
			// clean the old methods
			if (_logLevels instanceof Array) {
				_logLevels.forEach(function(logLevel) {
					delete self[logLevel];
				});
			}

			// set the new levels
			_logLevelMap = opts.levels;
			debugx.enabled && debugx('_logLevelMap: %s', JSON.stringify(_logLevelMap));

			_logLevels = LogConfig.sortLevels(_logLevelMap).map(function(item) {
				return item.key;
			});
			debugx.enabled && debugx('_logLevels: %s', JSON.stringify(_logLevels));

			_logLevels.forEach(function(logLevel) {
				self[logLevel] = self.log.bind(self, logLevel);
			});

			_logPosition = _logLevels.length - 1;
		}

		var level = opts.level || opts.logLevel;
		if (level && _logLevels.indexOf(level) >= 0) {
			_logPosition = _logLevels.indexOf(level);
		}
		if (level == 'all') {
			_logPosition = _logLevels.length - 1;
		}
		return this;
	}

	this._probe = function() {
		return _cachedMessages.slice().map(function(item) {
			item = item || [];
			return { severity: item[0], payload: item[1] }
		});
	}

	this._reset = function() {
		_cachedMessages.length = 0;
		return this;
	}

	var _isEnabledFor = function(level) {
		false && debugx.enabled && debugx('_isEnabledFor: %s / %s / %s', 
				level, _logLevels.indexOf(level), _logPosition);
		return (0 <= _logLevels.indexOf(level)) &&
				(_logLevels.indexOf(level) <= _logPosition);
	}

	Object.defineProperty(this, 'messages', {
		get: function() { return _cachedMessages.slice() },
		set: function(val) {}
	});

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

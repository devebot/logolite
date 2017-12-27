'use strict';

var debugx = require('debug')('logolite:MockLogger');

var MockLogger = function(params) {
	params = params || {};
	var self = this;

	var _logLevelMap = {
		error: 0,
		warn: 1,
		info: 2,
		debug: 3,
		trace: 4,
		verbose: 5
	}
	var _logLevels = Object.keys(_logLevelMap);
	var _logPosition = _logLevels.length - 1;

	var _cachedMessages = [];

	this.log = function(level) {
		if (_isEnabledFor(level)) {
			_cachedMessages.push(arguments);
		}
	}

	this._alter = function(opts) {
		opts = opts || {};

		if (opts.levels && typeof(opts.levels) === 'object') {
			_logLevelMap = opts.levels;
		}
		_logLevels = Object.keys(_logLevelMap);

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

	_logLevels.forEach(function(logLevel) {
		Object.defineProperty(self, logLevel, {
			get: function() {
				if (_isEnabledFor(logLevel)) {
					return self.log.bind(self, logLevel);
				}
				return null;
			},
			set: function(val) {}
		})
	})

	Object.defineProperty(this, 'messages', {
		get: function() { return _cachedMessages.slice() },
		set: function(val) {}
	});

	this._alter(params);
}

module.exports = MockLogger;

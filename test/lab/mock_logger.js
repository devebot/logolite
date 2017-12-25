'use strict';

var debugx = require('debug')('tdd:logolite:MockLogger');

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
	var _logPosition = 0;
	var _cachedMessages = [];

	this.log = function(level) {
		if (_isEnabledFor(level)) {
			_cachedMessages.push(arguments);
		}
	}

	this._alter = function(opts) {
		opts = opts || {};
		if (opts.logLevel && _logLevels.indexOf(opts.logLevel) >= 0) {
			_logPosition = _logLevels.indexOf(opts.logLevel);
		}
		return this;
	}

	this._reset = function() {
		_cachedMessages.length = 0;
		_logPosition = 0;
		return this;
	}

	var _isEnabledFor = function(level) {
		false && debugx.enabled && debugx('_isEnabledFor: %s / %s / %s', 
			level, _logLevels.indexOf(level), _logPosition);
		return _logLevels.indexOf(level) <= _logPosition;
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
	})
}

module.exports = MockLogger;

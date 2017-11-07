'use strict';

var debugx = require('debug')('tdd:logolite:MockLogger');

var MockLogger = function() {
	var self = this;
	var _cachedMessages = [];
	var _logLevels = ['error', 'warn', 'info', 'debug', 'trace', 'verbose'];
	var _logPosition = 0;

	var _isEnabledFor = function(level) {
		false && debugx.enabled && debugx('_isEnabledFor: %s / %s / %s', 
			level, _logLevels.indexOf(level), _logPosition);
		return _logLevels.indexOf(level) <= _logPosition;
	}

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

	_logLevels.forEach(function(level) {
		Object.defineProperty(self, level, {
			get: function() { return _isEnabledFor(level) },
			set: function(val) {}
		})
	})

	Object.defineProperty(this, 'messages', {
		get: function() { return _cachedMessages.slice() },
		set: function(val) {}
	})
}

module.exports = MockLogger;

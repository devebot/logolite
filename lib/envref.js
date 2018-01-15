'use strict';

module.exports = function(kwargs) {
	kwargs = kwargs || {};
	var _store = {};

	this.setup = function(vars) {
		vars = vars || {};
		Object.keys(vars).forEach(function(key) {
			if (_store[key] == undefined) {
				_store[key] = process.env[key];
			}
			process.env[key] = vars[key];
		});
		return this;
	}

	this.reset = function() {
		Object.keys(_store).forEach(function(key) {
			process.env[key] = _store[key];
			delete _store[key];
		});
		return this;
	}

	return this.setup(kwargs);
}

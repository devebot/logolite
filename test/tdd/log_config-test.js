'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var debugx = require('debug')('tdd:logolite:LogConfig');
var LogConfig = require('../../lib/log_config');

describe('logolite.LogConfig:', function() {
	this.timeout(1000 * 60 * 60);

	describe('libraryInfo:', function() {
		beforeEach(function() {
			LogConfig.reset();
		});

		it('should return library information when get libraryInfo', function() {
			var libinfo = LogConfig.libraryInfo;
			assert.equal(libinfo.lib_name, 'logolite');
			assert.property(libinfo, 'lib_version');
			assert.property(libinfo, 'os_name');
			assert.property(libinfo, 'os_version');
			assert.property(libinfo, 'os_arch');
			debugx.enabled && debugx('libraryInfo: %s', JSON.stringify(LogConfig.libraryInfo));
		})
	});
});

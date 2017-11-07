'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var debugx = require('debug')('tdd:logolite:LogTracer');
var freshy = require('freshy');

var LogTracer = freshy.freshy('../../lib/log_tracer');
var LogConfig = require('../../lib/log_config');

describe('logolite.LogTracer:', function() {
	this.timeout(1000 * 60 * 60);

	describe('libraryInfo:', function() {
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

	describe('branch() method:', function() {
		beforeEach(function() {
			LogConfig.reset();
		});

		afterEach(function() {
		});

		it('should create new child logTracer object', function() {
			process.env.LOGOLITE_INSTANCE_ID = 'node1';

			var LT1 = LogTracer.ROOT;
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"message": null,
				"instanceId": "node1"
			});

			var LT2 = LT1.branch({key: 'engineId', value: 'engine_123456'});
			var msg1 = '' + LT2;
			debugx.enabled && debugx('LT2-1: %s', msg1);
			assert.deepEqual(JSON.parse(msg1), {
				"message": null,
				"instanceId": "node1",
				"engineId": "engine_123456"
			});

			LT1.put("instanceId", "node2");
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"message": null,
				"instanceId": "node2"
			});
			assert.deepEqual(JSON.parse(LT1.reset().toString()), {
				"message": null,
				"instanceId": "node1"
			});

			LT2.put('message', 'Message #2')
				.put('integer', 100)
				.put('float', 123.456);
			var msg2 = '' + LT2;
			debugx.enabled && debugx('LT2-2: %s', msg2);
			assert.deepEqual(JSON.parse(msg2), {
				"instanceId": "node1",
				"engineId": "engine_123456",
				"message": "Message #2",
				"integer": 100,
				"float": 123.456
			});
			
			LT2.reset()
				.put('boolean', true)
				.put('message', 'Message renew #2');
			var msg3 = '' + LT2;
			debugx.enabled && debugx('LT2-3: %s', msg3);
			assert.deepEqual(JSON.parse(msg3), {
				"instanceId": "node1",
				"engineId": "engine_123456",
				"boolean": true,
				"message": "Message renew #2"
			});
		});
	});

	describe('copy() method:', function() {
		beforeEach(function() {
			LogConfig.reset();
		});

		it('should clone new separated logTracer object', function() {
			process.env.LOGOLITE_INSTANCE_ID = 'node1';

			var LT1 = LogTracer.ROOT;
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"message": null,
				"instanceId": "node1"
			});

			var LT2 = LT1.copy();
			var msg1 = '' + LT2;
			debugx.enabled && debugx('LT2-1: %s', msg1);
			assert.deepEqual(JSON.parse(msg1), {
				"message": null,
				"instanceId": "node1"
			});

			LT1.put("instanceId", "node2");
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"message": null,
				"instanceId": "node2"
			});

			LT2.put('message', 'Message #2')
				.put('integer', 100)
				.put('float', 123.456);
			var msg2 = '' + LT2;
			debugx.enabled && debugx('LT2-2: %s', msg2);
			assert.deepEqual(JSON.parse(msg2), {
				"instanceId": "node1",
				"message": "Message #2",
				"integer": 100,
				"float": 123.456
			});
			
			LT2.reset()
				.put('boolean', true)
				.put('message', 'Message renew #2');
			var msg3 = '' + LT2;
			debugx.enabled && debugx('LT2-3: %s', msg3);
			assert.deepEqual(JSON.parse(msg3), {
				"instanceId": "node1",
				"boolean": true,
				"message": "Message renew #2"
			});
		});
	});

	describe('interceptors:', function() {
		beforeEach(function() {
			LogConfig.reset();
		});

		it('should pass log object to interceptors', function() {
			process.env.LOGOLITE_INSTANCE_ID = 'node1';

			var logdata1, logdata2, logdata3;
			var LT1 = LogTracer.ROOT.reset();

			var I1 = function(logdata) {
				LT1.reset();
				assert.deepEqual(logdata, {
					"message": null,
					"instanceId": "node1"
				});
				logdata1 = logdata;
			};
			var I2 = {};
			var I3 = function(logdata) {
				LT1.reset();
				logdata3 = logdata;
			};

			LogTracer.addStringifyInterceptor(I1);
			LogTracer.addStringifyInterceptor(I2);
			LogTracer.addStringifyInterceptor(I3);
			assert.equal(LogTracer.stringifyInterceptorCount(), 2);

			var LT1 = LogTracer.ROOT.reset();
			assert.deepEqual(logdata2 = JSON.parse(LT1.toString()), {
				"message": null,
				"instanceId": "node1"
			});

			assert.isTrue(logdata1 === logdata3);
			assert.isTrue(logdata1 !== logdata2);
			assert.deepEqual(logdata1, logdata2);
		})
	});
});

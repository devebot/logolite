'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var debugx = require('debug')('tdd:logolite:LogTracer');
var LogTracer = require('../../lib/log_tracer');
var LogConfig = require('../../lib/log_config');

describe('logolite.LogTracer:', function() {
	this.timeout(1000 * 60 * 60);

	describe('branch() method:', function() {
		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
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
			LogTracer.reset();
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

	describe('formatting log objects:', function() {
		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
		});

		it('formatting is enabled if DEBUG is not empty', function() {
			var env_DEBUG = process.env.DEBUG;
			process.env.DEBUG = '*';

			var LT1 = LogTracer.ROOT.reset();
			var msg = LT1
				.add({
					name: 'Peter Pan',
					age: 1024,
					gender: true
				})
				.stringify({
					template: 'The boy named {name} is {age} year olds',
					reset: true
				});

			process.env.DEBUG = env_DEBUG;
			assert.equal(msg, 'The boy named Peter Pan is 1024 year olds');
		});

		it('formatting is always disabled if LOGOLITE_FORMATTING_ENABLED=false', function() {
			var env_DEBUG = process.env.DEBUG;

			process.env.DEBUG = '*';
			process.env.LOGOLITE_DEBUGLOG = 'true';
			process.env.LOGOLITE_FORMATTING_ENABLED = 'false';
			process.env.LOGOLITE_INSTANCE_ID = 'node1';

			var LT1 = LogTracer.ROOT.reset();
			var msg = LT1
				.add({
					name: 'Peter Pan',
					age: 1024,
					gender: true
				})
				.stringify({
					template: 'The boy named {name} is {age} year olds',
					reset: true
				});

			process.env.DEBUG = env_DEBUG;
			delete process.env.LOGOLITE_DEBUGLOG;
			delete process.env.LOGOLITE_FORMATTING_ENABLED;
			delete process.env.LOGOLITE_INSTANCE_ID;
			var obj = JSON.parse(msg);
			assert.deepEqual(obj, {"message":null,"instanceId":"node1","name":"Peter Pan","age":1024,"gender":true});
		});

		it('formatting is always enabled if LOGOLITE_FORMATTING_ENABLED=true', function() {
			process.env.LOGOLITE_FORMATTING_ENABLED = 'true';

			var LT1 = LogTracer.ROOT.reset();

			var msg = LT1
				.add({
					name: 'Peter Pan',
					age: 1024,
					gender: true
				})
				.stringify({
					template: 'The boy named {name} is {age} year olds',
					reset: true
				});

			assert.equal(msg, 'The boy named Peter Pan is 1024 year olds');
		});
	});

	describe('interceptors:', function() {
		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
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
		});

		afterEach(function() {
			LogTracer.clearStringifyInterceptors();
		})
	});

	describe('counting log objects:', function() {
		var counter = {};
		var countLogObject = LogTracer.countLogObject.bind(null, counter, [
			{
				matchingField: 'color',
				filter: ['red', 'green', 'blue'],
				countingField: 'rgbGroup'
			},
			{
				matchingField: 'checkpoint',
				filter: /COLOR.*03/g,
				countingField: 'regexpGroup'
			}
		]);

		before(function() {
			LogTracer.addStringifyInterceptor(countLogObject);
		});

		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
			Object.keys(counter).forEach(function(fieldName) {
				delete counter[fieldName];
			});
		});

		it('filters and counts by more than one patterns', function() {
			var LT1 = LogTracer.ROOT.branch({
				key: 'engineId', value: 'engine_123456'
			});

			var output = [];

			output = [
				LT1.add({
					color: 'black',
					checkpoint: 'COLOR_BLACK_01'
				}).toMessage({
					text: 'Men in {color} film'
				}),
				LT1.add({
					color: 'red',
					checkpoint: 'COLOR_RED_02'
				}).toMessage({
					text: '{color}boat fishsauce'
				}),
				LT1.add({
					color: 'blue',
					checkpoint: 'COLOR_BLUE_03'
				}).toMessage({
					text: '{color}sky computer'
				}),
				LT1.add({
					color: 'yellow',
					checkpoint: 'COLOR_YELLOW_03'
				}).toMessage({
					text: '{color}paper website'
				})
			];

			debugx.enabled && debugx('output: %s', JSON.stringify(output));
			assert.deepEqual(output, [
				"Men in black film",
				"redboat fishsauce",
				"bluesky computer",
				"yellowpaper website"
			]);

			debugx.enabled && debugx('counter: %s', JSON.stringify(counter));
			assert.deepEqual(counter, {
				"rgbGroup": 2,
				"regexpGroup": 2
			});
		});

		afterEach(function() {
			LogTracer.clearStringifyInterceptors();
		});
	});
});

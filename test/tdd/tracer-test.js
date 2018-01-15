'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var debugx = require('debug')('tdd:logolite:LogTracer');
var LogTracer = require('../../lib/tracer');
var LogConfig = require('../../lib/config');
var Envref = require('../../lib/envref');

describe('logolite.LogTracer:', function() {
	this.timeout(1000 * 60 * 60);
	var envref = new Envref();

	describe('static anchor fields:', function() {

		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
		});

		it('key and value will be stored in _nodeType_ and _nodeId_ fields', function() {
			envref.setup({
				LOGOLITE_INSTANCE_ID: 'node1',
				LOGOLITE_TRACING_ID_PREDEFINED: 'true'
			});

			var LT1 = LogTracer.ROOT;
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"_nodeId_": "node1",
				"_nodeType_": "instanceId"
			});

			var LT2 = LT1.branch({key: 'engineId', value: 'engine_123456'});
			var msg1 = '' + LT2;
			debugx.enabled && debugx('LT2-1: %s', msg1);
			assert.deepEqual(JSON.parse(msg1), {
				"_parentId_": "node1",
				"_nodeId_": "engine_123456",
				"_nodeType_": "engineId"
			});

			LT1.put("instanceId", "node2");
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"_nodeId_": "node1",
				"_nodeType_": "instanceId",
				"instanceId": "node2"
			});
			assert.deepEqual(JSON.parse(LT1.reset().toString()), {
				"_nodeId_": "node1",
				"_nodeType_": "instanceId"
			});

			LT2.put('message', 'Message #2')
				.put('integer', 100)
				.put('float', 123.456);
			var msg2 = '' + LT2;
			debugx.enabled && debugx('LT2-2: %s', msg2);
			assert.deepEqual(JSON.parse(msg2), {
				"_parentId_": "node1",
				"_nodeId_": "engine_123456",
				"_nodeType_": "engineId",
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
				"_parentId_": "node1",
				"_nodeId_": "engine_123456",
				"_nodeType_": "engineId",
				"boolean": true,
				"message": "Message renew #2"
			});

			envref.reset();
		});
	});

	describe('branch() method:', function() {
		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
		});

		it('should create new child logTracer object', function() {
			envref.setup({
				LOGOLITE_INSTANCE_ID: 'node1'
			});

			var LT1 = LogTracer.ROOT;
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"instanceId": "node1"
			});

			var LT2 = LT1.branch({key: 'engineId', value: 'engine_123456'});
			var msg1 = '' + LT2;
			debugx.enabled && debugx('LT2-1: %s', msg1);
			assert.deepEqual(JSON.parse(msg1), {
				"instanceId": "node1",
				"engineId": "engine_123456"
			});

			LT1.put("instanceId", "node2");
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"instanceId": "node2"
			});
			assert.deepEqual(JSON.parse(LT1.reset().toString()), {
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

			envref.reset();
		});
	});

	describe('copy() method:', function() {
		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
		});

		it('should clone new separated logTracer object', function() {
			envref.setup({
				LOGOLITE_INSTANCE_ID: 'node1'
			});

			var LT1 = LogTracer.ROOT;
			assert.deepEqual(JSON.parse(LT1.toString()), {
				"instanceId": "node1"
			});

			var LT2 = LT1.copy();
			var msg1 = '' + LT2;
			debugx.enabled && debugx('LT2-1: %s', msg1);
			assert.deepEqual(JSON.parse(msg1), {
				"instanceId": "node1"
			});

			LT1.put("instanceId", "node2");
			assert.deepEqual(JSON.parse(LT1.toString()), {
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

			envref.reset();
		});
	});

	describe('formatting log objects:', function() {
		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
		});

		it('formatting is enabled if DEBUG is not empty', function() {
			envref.setup({
				DEBUG: '*'
			});

			var LT1 = LogTracer.ROOT.reset();
			var msg = LT1
				.add({
					name: 'Peter Pan',
					age: 1024,
					gender: true
				})
				.stringify({
					template: 'The boy named {name} is {age} year olds'
				});

			assert.equal(msg, 'The boy named Peter Pan is 1024 year olds');
			envref.reset();
		});

		it('formatting is always disabled if LOGOLITE_TEXTFORMAT_ENABLED=false', function() {
			envref.setup({
				DEBUG: '*',
				LOGOLITE_DEBUGLOG: 'true',
				LOGOLITE_TEXTFORMAT_ENABLED: 'false',
				LOGOLITE_INSTANCE_ID: 'node1'
			});

			var LT1 = LogTracer.ROOT.reset();
			var msg = LT1
				.add({
					name: 'Peter Pan',
					age: 1024,
					gender: true
				})
				.stringify({
					template: 'The boy named {name} is {age} year olds'
				});

			var obj = JSON.parse(msg);
			assert.deepEqual(obj, {
				"instanceId":"node1",
				"name":"Peter Pan",
				"age":1024,
				"gender":true
			});

			envref.reset();
		});

		it('formatting is always enabled if LOGOLITE_TEXTFORMAT_ENABLED=true', function() {
			envref.setup({
				LOGOLITE_TEXTFORMAT_ENABLED: 'true'
			});

			var LT1 = LogTracer.ROOT.reset();

			var msg = LT1
				.add({
					name: 'Peter Pan',
					age: 1024,
					gender: true
				})
				.stringify({
					template: 'The boy named {name} is {age} year olds'
				});

			assert.equal(msg, 'The boy named Peter Pan is 1024 year olds');

			envref.reset();
		});
	});

	describe('interceptors:', function() {
		beforeEach(function() {
			LogConfig.reset();
			LogTracer.reset();
		});

		it('should pass log object to interceptors', function() {
			envref.setup({
				LOGOLITE_INSTANCE_ID: 'node1'
			});

			var logdata1, logdata2, logdata3;
			var LT1 = LogTracer.ROOT.reset();

			var I1 = function(logdata) {
				LT1.reset();
				assert.deepEqual(logdata, {
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
				"instanceId": "node1"
			});

			assert.isTrue(logdata1 === logdata3);
			assert.isTrue(logdata1 !== logdata2);
			assert.deepEqual(logdata1, logdata2);

			envref.reset();
		});

		afterEach(function() {
			LogTracer.clearStringifyInterceptors();
		})
	});

	describe('counting log objects:', function() {
		var counter = {};
		var countLogObject = LogTracer.accumulationAppender.bind(null, counter, [
			{
				counterField: 'emptyCondCounter',
				storageField: 'emptyCondStorage'
			},
			{
				matchingField: 'color',
				filter: ['red', 'green', 'blue'],
				counterField: 'rgbGroup'
			},
			{
				matchingField: 'checkpoint',
				filter: /COLOR.*03/g,
				counterField: 'regexpGroup'
			},
			{
				anyTags: ['entertainment', 'technology'],
				counterField: 'anyTagsCount'
			},
			{
				allTags: ['advertise', 'technology'],
				counterField: 'allTagsCount'
			},
			{
				matchingField: 'color',
				filter: ['red', 'yellow', 'blue'],
				anyTags: ['food', 'entertainment'],
				counterField: 'filterAndTags'
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
					tags: ['advertise', 'entertainment'],
					text: 'Men in {color} film'
				}),
				LT1.add({
					color: 'red',
					checkpoint: 'COLOR_RED_02'
				}).toMessage({
					tags: ['food', 'technology'],
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
					tags: ['advertise', 'IT', 'technology'],
					text: '{color}paper website'
				})
			];

			debugx.enabled && debugx('output: %s', JSON.stringify(output));
			assert.sameMembers(output, [
				"Men in black film",
				"redboat fishsauce",
				"bluesky computer",
				"yellowpaper website"
			]);

			debugx.enabled && debugx('counter: %s', JSON.stringify(counter));
			assert.include(counter, {
				"allTagsCount": 1,
				"anyTagsCount": 3,
				"filterAndTags": 1,
				"rgbGroup": 2,
				"regexpGroup": 2
			});

			assert.isUndefined(counter.emptyCondCounter);
			assert.isUndefined(counter.emptyCondStorage);
		});

		after(function() {
			LogTracer.clearStringifyInterceptors();
		});
	});
});

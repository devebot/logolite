'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var debugx = require('debug')('tdd:logolite:LogAdapter');
var LogAdapter = require('../../lib/adapter');
var LogConfig = require('../../lib/config');
var MockLogger = require('../../lib/logmock');

describe('logolite.LogAdapter:', function() {
	this.timeout(1000 * 60 * 60);

	var consoleLog = process.env.LOGOLITE_DEBUGLOG;

	before(function() {
		delete process.env.LOGOLITE_DEBUGLOG;
	});

	it('should run in LogIdTreeEnabled mode', function() {
		var mock = (new MockLogger())._alter({ logLevel: 'info' });
		LogAdapter.connectTo(mock);
		var logger = LogAdapter.getLogger();

		logger.log('trace', {'msg': 'This is trace level'});

		logger.log('debug', {'msg': 'This is debug level'});

		logger.isEnabledFor('info') && logger.log('info', {
			'instanceId': LogConfig.DEFAULT_INSTANCE_ID, 
			'engineId': 'eef420ff-9eb7-474a-996a-f63b121100a8',
			'field1': 'Value 1',
			'field2': 'Value 2'
		});

		logger.isEnabledFor('info') && logger.log('info', {
			'engineId': 'eef420ff-9eb7-474a-996a-f63b121100a8',
			'consumerId': 'consumer#1'
		});

		logger.isEnabledFor('info') && logger.log('info', {
			'engineId': 'eef420ff-9eb7-474a-996a-f63b121100a8',
			'consumerId': 'consumer#2'
		});

		assert.equal(mock.messages.length, 4);
		assert.include(mock.messages[1][1], {
			'instanceId': LogConfig.DEFAULT_INSTANCE_ID,
			'engineId': 'eef420ff-9eb7-474a-996a-f63b121100a8',
			'field1': 'Value 1',
			'field2': 'Value 2'
		});
		debugx.enabled && debugx('Log messages: %s', JSON.stringify(mock.messages, null, 2));
	});

	it('Write log with new level that transformed by level mappings', function() {
		var mock = (new MockLogger())._alter({
			levels: {
				level_e: 0,
				level_w: 1,
				level_i: 2,
				level_d: 3,
				level_t: 4,
				level_s: 5
			},
			logLevel: 'level_i'
		});
		LogAdapter.connectTo(mock);
		var logger = LogAdapter.getLogger({
			mappings: {
				'silly': 'level_s',
				'trace': 'level_t',
				'debug': 'level_d',
				'info': 'level_i',
				'warn': 'level_w',
				'error': 'level_e'
			}
		});

		logger.log('trace', {'msg': 'This is trace level'});

		logger.log('debug', {'msg': 'This is debug level'});

		logger.isEnabledFor('info') && logger.log('info', {
			'instanceId': LogConfig.DEFAULT_INSTANCE_ID,
			'engineId': 'eef420ff-9eb7-474a-996a-f63b121100a8',
			'field1': 'Value 1',
			'field2': 'Value 2'
		});

		logger.isEnabledFor('info') && logger.log('info', {
			'engineId': 'eef420ff-9eb7-474a-996a-f63b121100a8',
			'consumerId': 'consumer#1'
		});

		logger.isEnabledFor('info') && logger.log('info', {
			'engineId': 'eef420ff-9eb7-474a-996a-f63b121100a8',
			'consumerId': 'consumer#2'
		});

		console.log(mock.messages);

		assert.equal(mock.messages.length, 3);
		assert.include(mock.messages[0][1], {
			'instanceId': LogConfig.DEFAULT_INSTANCE_ID,
			'engineId': 'eef420ff-9eb7-474a-996a-f63b121100a8',
			'field1': 'Value 1',
			'field2': 'Value 2'
		});
		debugx.enabled && debugx('Log messages: %s', JSON.stringify(mock.messages, null, 2));
	});

	after(function() {
		consoleLog && (process.env.LOGOLITE_DEBUGLOG = consoleLog);
	});

});

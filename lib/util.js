'use strict';

var slugid = require('slugid');
var uuidV4 = require('uuid/v4');
var misc = {}

Object.defineProperties(misc, {
  'DEFAULT_INSTANCE_ID': {
    get: function() {
      return process.env.LOGOLITE_INSTANCE_ID;
    },
    set: function(value) {}
  },
  'DEFAULT_SCOPE': {
    get: function() {
      return process.env.LOGOLITE_DEFAULT_SCOPE || 'logolite:default';
    },
    set: function(value) {}
  },
  'MAX_LOG_LEVEL': {
    get: function() {
      return process.env.LOGOLITE_MAXLEVEL;
    },
    set: function(value) {}
  },
  'IS_DEBUGLOG': {
    get: function() {
      return process.env.LOGOLITE_DEBUGLOG;
    },
    set: function(value) {}
  },
  'IS_INTERCEPTOR_ENABLED': {
    get: function() {
      return process.env.LOGOLITE_DEBUGLOG != 'false';
    },
    set: function(value) {}
  },
  'IS_SAFE_STRINGIFY': {
    get: function() {
      return process.env.LOGOLITE_SAFE_STRINGIFY != 'false';
    },
    set: function(value) {}
  },
  'EMPTY_FUNCTION': {
    get: function() {
      return function() {};
    },
    set: function(value) {}
  }
});

misc.getUUID = uuidV4;
misc.getLogID = process.env.OPFLOW_BASE64UUID ? slugid.v4 : uuidV4;

misc.getCurrentTime = function() {
  return new Date();
}

misc.stringify = function(data) {
  if (data === undefined) data = null;
  return (typeof(data) === 'string') ? data : JSON.stringify(data);
}

misc.bufferify = function(data) {
  return (data instanceof Buffer) ? data : new Buffer(this.stringify(data));
}

misc.getPackageInfo = function() {
  return require(require('app-root-path').resolve('./package.json'));
}

module.exports = misc;

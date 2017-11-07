'use strict';

var fs = require('fs');
var os = require('os');
var appRootPath = require('app-root-path');
var slugid = require('slugid');
var uuidV4 = require('uuid/v4');
var misc = {}

//====================================================================

var DEFAULT_INSTANCE_ID = null;
var DEFAULT_SCOPE = null;
var ALWAYS_ENABLED = null;
var AUTO_DETECT_FOR = null;
var USE_BASE64_UUID = null;
var IS_DEBUGLOG = null;
var IS_INTERCEPTOR_ENABLED = null;
var IS_STRINGIFY_ENABLED = null;
var IS_STRINGIFY_PROTECTED = null;

//====================================================================

Object.defineProperties(misc, {
  'DEFAULT_INSTANCE_ID': {
    get: function() {
      DEFAULT_INSTANCE_ID = DEFAULT_INSTANCE_ID ||
          process.env.LOGOLITE_INSTANCE_ID || misc.getLogID();
      return DEFAULT_INSTANCE_ID;
    },
    set: function(value) {}
  },
  'DEFAULT_SCOPE': {
    get: function() {
      DEFAULT_SCOPE = DEFAULT_SCOPE ||
          process.env.LOGOLITE_DEFAULT_SCOPE || 'logolite:default';
      return DEFAULT_SCOPE;
    },
    set: function(value) {}
  },
  'ALWAYS_ENABLED': {
    get: function() {
      if (ALWAYS_ENABLED === null) {
        ALWAYS_ENABLED = process.env.LOGOLITE_ALWAYS_ENABLED || '';
        ALWAYS_ENABLED = ALWAYS_ENABLED.split(',');
      }
      return ALWAYS_ENABLED;
    },
    set: function(value) {}
  },
  'AUTO_DETECT_FOR': {
    get: function() {
      AUTO_DETECT_FOR = AUTO_DETECT_FOR ||
          process.env.LOGOLITE_AUTO_DETECT_FOR || '';
      return AUTO_DETECT_FOR;
    },
    set: function(value) {}
  },
  'USE_BASE64_UUID': {
    get: function() {
      if (USE_BASE64_UUID === null) {
        USE_BASE64_UUID = process.env.LOGOLITE_BASE64_UUID !== 'false';
      }
      return USE_BASE64_UUID;
    },
    set: function(value) {}
  },
  'IS_DEBUGLOG': {
    get: function() {
      if (IS_DEBUGLOG === null) {
        IS_DEBUGLOG = process.env.LOGOLITE_DEBUGLOG === 'true';
      }
      return IS_DEBUGLOG;
    },
    set: function(value) {}
  },
  'IS_INTERCEPTOR_ENABLED': {
    get: function() {
      if (IS_INTERCEPTOR_ENABLED === null) {
        IS_INTERCEPTOR_ENABLED = process.env.LOGOLITE_INTERCEPTOR_ENABLED !== 'false';
      }
      return IS_INTERCEPTOR_ENABLED;
    },
    set: function(value) {}
  },
  'IS_STRINGIFY_ENABLED': {
    get: function() {
      if (IS_STRINGIFY_ENABLED === null) {
        IS_STRINGIFY_ENABLED = process.env.LOGOLITE_STRINGIFY_DISABLED !== 'true';
      }
      return IS_STRINGIFY_ENABLED;
    },
    set: function(value) {}
  },
  'IS_STRINGIFY_PROTECTED': {
    get: function() {
      if (IS_STRINGIFY_PROTECTED === null) {
        IS_STRINGIFY_PROTECTED = process.env.LOGOLITE_STRINGIFY_PROTECTED !== 'false';
      }
      return IS_STRINGIFY_PROTECTED;
    },
    set: function(value) {}
  }
});

//====================================================================

misc.reset = function() {
  DEFAULT_INSTANCE_ID = null;
  DEFAULT_SCOPE = null;
  ALWAYS_ENABLED = null;
  AUTO_DETECT_FOR = null;
  USE_BASE64_UUID = null;
  IS_DEBUGLOG = null;
  IS_INTERCEPTOR_ENABLED = null;
  IS_STRINGIFY_ENABLED = null;
  IS_STRINGIFY_PROTECTED = null;
}

misc.isAlwaysEnabledFor = function(level) {
  if (misc.ALWAYS_ENABLED.indexOf('all') >= 0) return true;
  return misc.ALWAYS_ENABLED.indexOf(level) >= 0;
}

var isNullOrArray = function(val) {
  return (val instanceof Array) || (val === null);
}

var isNullOrString = function(val) {
  return (typeof(val) === 'string') || (val === null);
}

misc.getLogID = misc.USE_BASE64_UUID ? slugid.v4 : uuidV4;

misc.clone = function(data) {
  if (data === undefined || data === null) return data;
  if (typeof(data) !== 'object') return data;
  return Object.assign({}, data);
}

misc.stringify = function(data) {
  if (data === undefined) data = null;
  if (typeof(data) === 'string') return data;
  var json = null;
  if (misc.IS_STRINGIFY_PROTECTED) {
    try {
      json = JSON.stringify(data);
    } catch (error) {
      json = JSON.stringify({ safeguard: 'JSON.stringify() error' });
    }
  } else {
    json = JSON.stringify(data);
  }
  return json;
}

misc.getPackageInfo = function() {
  return require(appRootPath.resolve('./package.json'));
}

var libraryInfo = null;

Object.defineProperties(misc, {
  'libraryInfo': {
    get: function() {
      if (libraryInfo == null) {
        var pkgInfo = misc.getPackageInfo();
        libraryInfo = {
          message: process.env.LOGOLITE_INFO_MESSAGE || 'Application Information',
          lib_name: pkgInfo.name,
          lib_version: pkgInfo.version,
          os_name: os.platform(),
          os_version: os.release(),
          os_arch: os.arch()
        }
      }
      return libraryInfo;
    },
    set: function(value) {}
  }
});

module.exports = misc;

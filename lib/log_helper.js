'use strict';

var fs = require('fs');
var os = require('os');
var appRootPath = require('app-root-path');
var slugid = require('slugid');
var uuidV4 = require('uuid/v4');
var misc = {}

var ALWAYS_ENABLED = process.env.LOGOLITE_ALWAYS_ENABLED || '';
ALWAYS_ENABLED = ALWAYS_ENABLED.split(',');

misc.isAlwaysEnabledFor = function(level) {
  if (ALWAYS_ENABLED.indexOf('all') >= 0) return true;
  return ALWAYS_ENABLED.indexOf(level) >= 0;
}

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
  'ALWAYS_ENABLED': {
    get: function() {
      return ALWAYS_ENABLED;
    },
    set: function(value) {}
  },
  'AUTO_DETECT_FOR': {
    get: function() {
      return process.env.LOGOLITE_AUTO_DETECT_FOR || '';
    },
    set: function(value) {}
  },
  'USE_BASE64_UUID': {
    get: function() {
      return process.env.LOGOLITE_BASE64_UUID !== 'false';
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
      return process.env.LOGOLITE_INTERCEPTOR_ENABLED !== 'false';
    },
    set: function(value) {}
  },
  'STRINGIFY_ENABLED': {
    get: function() {
      return process.env.LOGOLITE_STRINGIFY_DISABLED !== 'true';
    },
    set: function(value) {}
  },
  'IS_SAFE_STRINGIFY': {
    get: function() {
      return process.env.LOGOLITE_SAFE_STRINGIFY !== 'false';
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
  if (misc.IS_SAFE_STRINGIFY) {
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

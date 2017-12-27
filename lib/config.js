'use strict';

var fs = require('fs');
var os = require('os');
var appRootPath = require('app-root-path');
var slugid = require('slugid');
var uuidV4 = require('uuid/v4');
var misc = {}

//====================================================================

var store = {
  DEFAULT_INSTANCE_ID: null,
  DEFAULT_SCOPE: null,
  ALWAYS_ENABLED: null,
  AUTO_DETECT_FOR: null,
  DEBUGLOG_NAME: null,
  USE_BASE64_UUID: null,
  IS_DEBUGLOG: null,
  IS_MOCKLOGGER_ENABLED: null,
  IS_FORMATTING_ENABLED: null,
  IS_INTERCEPTOR_ENABLED: null,
  IS_STRINGIFY_ENABLED: null,
  IS_STRINGIFY_PROTECTED: null
}

//====================================================================

var properties = {
  'DEFAULT_INSTANCE_ID': {
    get: function() {
      store.DEFAULT_INSTANCE_ID = store.DEFAULT_INSTANCE_ID ||
          process.env.LOGOLITE_INSTANCE_ID || misc.getLogID();
      return store.DEFAULT_INSTANCE_ID;
    }
  },
  'DEFAULT_SCOPE': {
    get: function() {
      store.DEFAULT_SCOPE = store.DEFAULT_SCOPE ||
          process.env.LOGOLITE_DEFAULT_SCOPE || 'logolite:default';
      return store.DEFAULT_SCOPE;
    }
  },
  'ALWAYS_ENABLED': {
    get: function() {
      if (store.ALWAYS_ENABLED === null) {
        store.ALWAYS_ENABLED = process.env.LOGOLITE_ALWAYS_ENABLED || '';
        store.ALWAYS_ENABLED = store.ALWAYS_ENABLED.split(',');
      }
      return store.ALWAYS_ENABLED;
    }
  },
  'AUTO_DETECT_FOR': {
    get: function() {
      store.AUTO_DETECT_FOR = store.AUTO_DETECT_FOR ||
          process.env.LOGOLITE_AUTO_DETECT_FOR || '';
      return store.AUTO_DETECT_FOR;
    }
  },
  'DEBUGLOG_NAME': {
    get: function() {
      store.DEBUGLOG_NAME = store.DEBUGLOG_NAME ||
          process.env.LOGOLITE_DEBUGLOG_NAME || 'conlog';
      return store.DEBUGLOG_NAME;
    }
  },
  'USE_BASE64_UUID': {
    get: function() {
      if (store.USE_BASE64_UUID === null) {
        store.USE_BASE64_UUID = process.env.LOGOLITE_BASE64_UUID !== 'false';
      }
      return store.USE_BASE64_UUID;
    }
  },
  'IS_DEBUGLOG': {
    get: function() {
      if (store.IS_DEBUGLOG === null) {
        store.IS_DEBUGLOG = process.env.LOGOLITE_DEBUGLOG === 'true';
      }
      return store.IS_DEBUGLOG;
    }
  },
  'IS_MOCKLOGGER_ENABLED': {
    get: function() {
      if (store.IS_MOCKLOGGER_ENABLED === null) {
        store.IS_MOCKLOGGER_ENABLED = process.env.LOGOLITE_MOCKLOGGER_ENABLED === 'true';
      }
      return store.IS_MOCKLOGGER_ENABLED;
    }
  },
  'IS_INTERCEPTOR_ENABLED': {
    get: function() {
      if (store.IS_INTERCEPTOR_ENABLED === null) {
        store.IS_INTERCEPTOR_ENABLED = process.env.LOGOLITE_INTERCEPTOR_ENABLED !== 'false';
      }
      return store.IS_INTERCEPTOR_ENABLED;
    }
  },
  'IS_FORMATTING_ENABLED': {
    get: function() {
      if (store.IS_FORMATTING_ENABLED == null) {
        store.IS_FORMATTING_ENABLED = process.env.LOGOLITE_FORMATTING_ENABLED === 'true';
        if (store.IS_FORMATTING_ENABLED !== true) {
          if (process.env.LOGOLITE_FORMATTING_ENABLED !== 'false') {
            store.IS_FORMATTING_ENABLED = !(process.env.DEBUG == undefined);
          }
        }
      }
      return store.IS_FORMATTING_ENABLED;
    }
  },
  'IS_STRINGIFY_ENABLED': {
    get: function() {
      if (store.IS_STRINGIFY_ENABLED === null) {
        store.IS_STRINGIFY_ENABLED = process.env.LOGOLITE_STRINGIFY_DISABLED !== 'true';
      }
      return store.IS_STRINGIFY_ENABLED;
    }
  },
  'IS_STRINGIFY_PROTECTED': {
    get: function() {
      if (store.IS_STRINGIFY_PROTECTED === null) {
        store.IS_STRINGIFY_PROTECTED = process.env.LOGOLITE_STRINGIFY_PROTECTED !== 'false';
      }
      return store.IS_STRINGIFY_PROTECTED;
    }
  }
}

Object.keys(properties).forEach(function(name) {
  properties[name]['set'] = function(value) {};
});

Object.defineProperties(misc, properties);

properties = undefined;

//====================================================================

misc.reset = function(args) {
  args = args || {};
  Object.keys(store).forEach(function(key) {
    delete store[key];
    store[key] = args[key] || null;
  });
  return misc;
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
  if (data instanceof Array) return data.slice();
  if (typeof(data) === 'object') return Object.assign({}, data);
  return data;
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
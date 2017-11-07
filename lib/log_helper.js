'use strict';

var fs = require('fs');
var os = require('os');
var appRootPath = require('app-root-path');
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
      return process.env.LOGOLITE_DEBUGLOG !== 'false';
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

misc.getUUID = uuidV4;
misc.getLogID = process.env.LOGOLITE_BASE64_UUID ? slugid.v4 : uuidV4;

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
  return require(appRootPath.resolve('./package.json'));
}

var libraryInfo = null;
var libraryInfoString = null;

Object.defineProperties(misc, {
  'libraryInfo': {
    get: function() {
      if (libraryInfo == null) {
        var pkgInfo = misc.getPackageInfo();
        libraryInfo = {
          message: 'Application Information',
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
  },
  'libraryInfoString': {
    get: function() {
      return libraryInfoString = libraryInfoString ||
          JSON.stringify(misc.libraryInfo);
    },
    set: function(value) {}
  }
});

module.exports = misc;

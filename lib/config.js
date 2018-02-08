'use strict';

var os = require('os');
var appRootPath = require('app-root-path');
var uuidV4 = require('uuid/v4');
var getEnvOpt = require('./envtool').getEnvOpt;
var misc = {}

//====================================================================

var store = {
  DEFAULT_INSTANCE_ID: null,
  DEFAULT_SECTOR: null,
  TAGS_FIELD_NAME: null,
  TEXT_FIELD_NAME: null,
  ALWAYS_ENABLED: null,
  AUTO_DETECT_FOR: null,
  DEBUGLOG_NAME: null,
  DEBUGLOG_NAMES: null,
  USE_BASE64_UUID: null,
  TRACKING_DEPTH: null,
  IS_DEBUGLOG: null,
  IS_MOCKLOGGER_ENABLED: null,
  IS_TAGS_EMBEDDABLE: null,
  IS_TEXT_EMBEDDABLE: null,
  IS_TEMPLATE_APPLIED: null,
  IS_TRACING_ID_PREDEFINED: null,
  IS_INTERCEPTOR_ENABLED: null,
  IS_STRINGIFY_ENABLED: null,
  IS_STRINGIFY_PROTECTED: null
}

//====================================================================

var parseDebuglogLevels = function() {
  var consoleLevels = getEnvOpt('LOGOLITE_DEBUGLOG_NAME') || 'conlog';
  store.DEBUGLOG_NAMES = consoleLevels.split(',').map(function(item) {
    return item.trim();
  });
  if (store.DEBUGLOG_NAMES.length > 0) {
    store.DEBUGLOG_NAME = store.DEBUGLOG_NAME || store.DEBUGLOG_NAMES[0];
  }
}

var properties = {
  DEFAULT_INSTANCE_ID: {
    get: function() {
      store.DEFAULT_INSTANCE_ID = store.DEFAULT_INSTANCE_ID ||
          getEnvOpt('LOGOLITE_INSTANCE_ID') || misc.getLogID();
      return store.DEFAULT_INSTANCE_ID;
    }
  },
  DEFAULT_SECTOR: {
    get: function() {
      store.DEFAULT_SECTOR = store.DEFAULT_SECTOR ||
          getEnvOpt('LOGOLITE_DEFAULT_SECTOR') || 'logolite-default';
      return store.DEFAULT_SECTOR;
    }
  },
  TAGS_FIELD_NAME: {
    get: function() {
      store.TAGS_FIELD_NAME = store.TAGS_FIELD_NAME ||
          getEnvOpt('LOGOLITE_TAGS_FIELD_NAME') || '_tags_';
      return store.TAGS_FIELD_NAME;
    }
  },
  TEXT_FIELD_NAME: {
    get: function() {
      store.TEXT_FIELD_NAME = store.TEXT_FIELD_NAME ||
          getEnvOpt('LOGOLITE_TEXT_FIELD_NAME') || '_text_';
      return store.TEXT_FIELD_NAME;
    }
  },
  ALWAYS_ENABLED: {
    get: function() {
      if (store.ALWAYS_ENABLED === null) {
        store.ALWAYS_ENABLED = getEnvOpt('LOGOLITE_ALWAYS_ENABLED') || '';
        store.ALWAYS_ENABLED = store.ALWAYS_ENABLED.split(',');
      }
      return store.ALWAYS_ENABLED;
    }
  },
  AUTO_DETECT_FOR: {
    get: function() {
      store.AUTO_DETECT_FOR = store.AUTO_DETECT_FOR ||
          getEnvOpt('LOGOLITE_AUTO_DETECT_FOR') || '';
      return store.AUTO_DETECT_FOR;
    }
  },
  DEBUGLOG_NAME: {
    get: function() {
      if (store.DEBUGLOG_NAME === null) parseDebuglogLevels();
      return store.DEBUGLOG_NAME;
    }
  },
  DEBUGLOG_NAMES: {
    get: function() {
      if (store.DEBUGLOG_NAMES === null) parseDebuglogLevels();
      return store.DEBUGLOG_NAMES;
    }
  },
  USE_BASE64_UUID: {
    get: function() {
      if (store.USE_BASE64_UUID === null) {
        store.USE_BASE64_UUID = getEnvOpt('LOGOLITE_BASE64_UUID') !== 'false';
      }
      return store.USE_BASE64_UUID;
    }
  },
  TRACKING_DEPTH: {
    get: function() {
      if (store.TRACKING_DEPTH === null) {
        var depth = parseInt(getEnvOpt('LOGOLITE_TRACKING_DEPTH'));
        store.TRACKING_DEPTH = isNaN(depth) ? 2 : depth;
      }
      return store.TRACKING_DEPTH;
    }
  },
  IS_DEBUGLOG: {
    get: function() {
      if (store.IS_DEBUGLOG === null) {
        store.IS_DEBUGLOG = getEnvOpt('LOGOLITE_DEBUGLOG') === 'true';
      }
      return store.IS_DEBUGLOG;
    }
  },
  IS_MOCKLOGGER_ENABLED: {
    get: function() {
      if (store.IS_MOCKLOGGER_ENABLED === null) {
        store.IS_MOCKLOGGER_ENABLED = getEnvOpt('LOGOLITE_MOCKLOGGER_ENABLED') === 'true';
      }
      return store.IS_MOCKLOGGER_ENABLED;
    }
  },
  IS_INTERCEPTOR_ENABLED: {
    get: function() {
      if (store.IS_INTERCEPTOR_ENABLED === null) {
        store.IS_INTERCEPTOR_ENABLED = getEnvOpt('LOGOLITE_INTERCEPTOR_ENABLED') !== 'false';
      }
      return store.IS_INTERCEPTOR_ENABLED;
    }
  },
  IS_TAGS_EMBEDDABLE: {
    get: function() {
      if (store.IS_TAGS_EMBEDDABLE === null) {
        store.IS_TAGS_EMBEDDABLE = getEnvOpt('LOGOLITE_TAGS_EMBEDDABLE') !== 'false';
      }
      return store.IS_TAGS_EMBEDDABLE;
    }
  },
  IS_TEXT_EMBEDDABLE: {
    get: function() {
      if (store.IS_TEXT_EMBEDDABLE === null) {
        store.IS_TEXT_EMBEDDABLE = getEnvOpt('LOGOLITE_TEXT_EMBEDDABLE') === 'true';
      }
      return store.IS_TEXT_EMBEDDABLE;
    }
  },
  IS_TEMPLATE_APPLIED: {
    get: function() {
      if (store.IS_TEMPLATE_APPLIED == null) {
        store.IS_TEMPLATE_APPLIED = getEnvOpt('LOGOLITE_TEMPLATE_APPLIED') === 'true';
        if (store.IS_TEMPLATE_APPLIED !== true) {
          if (getEnvOpt('LOGOLITE_TEMPLATE_APPLIED') !== 'false') {
            store.IS_TEMPLATE_APPLIED = !(getEnvOpt('DEBUG') == undefined);
          }
        }
      }
      return store.IS_TEMPLATE_APPLIED;
    }
  },
  IS_TRACING_ID_PREDEFINED: {
    get: function() {
      if (store.IS_TRACING_ID_PREDEFINED === null) {
        store.IS_TRACING_ID_PREDEFINED = getEnvOpt('LOGOLITE_TRACING_ID_PREDEFINED') === 'true';
      }
      return store.IS_TRACING_ID_PREDEFINED;
    }
  },
  IS_STRINGIFY_ENABLED: {
    get: function() {
      if (store.IS_STRINGIFY_ENABLED === null) {
        store.IS_STRINGIFY_ENABLED = getEnvOpt('LOGOLITE_STRINGIFY_DISABLED') !== 'true';
      }
      return store.IS_STRINGIFY_ENABLED;
    }
  },
  IS_STRINGIFY_PROTECTED: {
    get: function() {
      if (store.IS_STRINGIFY_PROTECTED === null) {
        store.IS_STRINGIFY_PROTECTED = getEnvOpt('LOGOLITE_STRINGIFY_PROTECTED') !== 'false';
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

misc.sortLevels = function(levelMap, isInteger) {
  isInteger = isInteger || true;
  var sortable = [];
  for(var key in levelMap) {
    if(levelMap.hasOwnProperty(key)) sortable.push({key:key, value:levelMap[key]});
  }
  if(isInteger) {
    sortable.sort(function(a, b) { return (a.value - b.value) });
  } else {
    sortable.sort(function(a, b) {
      var x = a.value.toLowerCase(), y = b.value.toLowerCase();
      return x<y ? -1 : x>y ? 1 : 0;
    });
  }
  return sortable; // array in format [{key:k1, value:v1}, {key:k2, value:v2}, ...]
}

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

misc.getLogID = function(opts) {
  if ((opts && opts.uuid) || !misc.USE_BASE64_UUID) return uuidV4();
  return uuidV4(null, new Buffer(16))
      .toString('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .substring(0, 22); // remove '=='
};

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
  libraryInfo: {
    get: function() {
      if (libraryInfo == null) {
        var pkgInfo = misc.getPackageInfo();
        libraryInfo = {
          message: getEnvOpt('LOGOLITE_INFO_MESSAGE') || 'Application Information',
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

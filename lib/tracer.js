'use strict';

var LogConfig = require('./config');
var LogFormat = require('./format');

var LogTracer = function(params) {
  params = params || {
    key: 'instanceId',
    value: LogConfig.DEFAULT_INSTANCE_ID
  };
  var self = this;

  var __parent = params.parent;
  var __key = params.key;
  var __value = params.value;
  var __store = {};
  var __frozen = [];

  Object.defineProperties(this, {
    'parent': {
      get: function() { return __parent },
      set: function(val) {}
    },
    'key': {
      get: function() { return __key },
      set: function(val) {}
    },
    'value': {
      get: function() { return __value },
      set: function(val) {}
    }
  });

  self.clear = function() {
    var __storeKeys = Object.keys(__store);
    if (__storeKeys.length > __frozen.length) {
      __storeKeys.forEach(function(fieldName) {
        if (__frozen.indexOf(fieldName) < 0) delete __store[fieldName];
      });
    }
    return this;
  }

  self.reset = function(level) {
    __store = __clearMap(__store);
    level = level || 2;
    if (level > 0) {
      if (level == 1) {
        if (self.parent) {
          __store[self.parent.key] = self.parent.value;
        }
      } else {
        var ref = self.parent;
        while(ref) {
          __store[ref.key] = ref.value;
          ref = ref.parent;
        }
      }
    }
    __store[__key] = __value;
    __frozen = Object.keys(__store);
    return this;
  }

  self.branch = function(origin) {
    return new LogTracer({parent: this, key: origin.key, value: origin.value});
  }

  self.copy = function() {
    return new LogTracer(this);
  }

  self.get = function(key) {
    return __store[key];
  }

  self.put = function(key, value) {
    if (key && value) __store[key] = value;
    return this;
  }

  self.add = function(map) {
    if (map) {
      Object.keys(map).forEach(function(key) {
        __store[key] = map[key];
      });
    }
    return this;
  }

  self.toMessage = function(opts) {
    opts = opts || {};
    var msg = null;
    var tmpl = opts.text || opts.tmpl || opts.template;
    if (LogConfig.IS_TEXTFORMAT_ENABLED && tmpl) {
      msg = LogFormat(tmpl, __store);
      var TEXT_FIELD = LogConfig.DEFAULT_TEXTFORMAT_FIELD;
      if (LogConfig.IS_TEXTFORMAT_STORED && __store[TEXT_FIELD] == null) {
        __store[TEXT_FIELD] = msg;
      }
    } else {
      if (LogConfig.IS_STRINGIFY_ENABLED || opts.stringify) {
        msg = LogConfig.stringify(__store);
      } else {
        msg = LogConfig.clone(__store);
      }
    }
    if (LogConfig.IS_CHECKPOINT_ENABLED) {
      var tick = opts.tick || opts.step || opts.checkpoint;
      if (LogConfig.IS_CHECKPOINT_STORED && tick) {
        __store[LogConfig.DEFAULT_CHECKPOINT_FIELD]= tick;
      }
    }
    if (LogConfig.IS_INTERCEPTOR_ENABLED) {
      var logobj = LogConfig.clone(__store);
      var tags = (opts.tags instanceof Array) && LogConfig.clone(opts.tags);
      _interceptors.forEach(function(interceptor) {
        interceptor(logobj, tags, __key, __value, __parent);
      });
    }
    opts.reset && self.reset();
    (opts.clear !== false) && self.clear();
    return msg;
  }

  self.stringify = function(opts) {
    opts = opts || {};
    opts.stringify = true;
    return self.toMessage(opts);
  }

  self.toString = function(opts) {
    return self.stringify(opts);
  }

  var __clearMap = function(map) {
    Object.keys(map).forEach(function(key) {
      delete map[key];
    });
    return map;
  }

  Object.defineProperties(self, {
    getLogID: {
      get: function() { return LogConfig.getLogID },
      set: function(value) {}
    }
  });

  self.reset();
}

var _interceptors = [];

Object.defineProperties(LogTracer, {
  getLogID: {
    get: function() { return LogConfig.getLogID },
    set: function(value) {}
  },
  isInterceptorEnabled: {
    get: function() { return LogConfig.IS_INTERCEPTOR_ENABLED },
    set: function(value) {}
  },
  addStringifyInterceptor: {
    get: function() {
      return function(f) {
        if (typeof(f) === 'function' && _interceptors.indexOf(f) < 0) {
          _interceptors.push(f);
          return true;
        }
        return false;
      }
    },
    set: function(value) {}
  },
  removeStringifyInterceptor: {
    get: function() {
      return function(f) {
        var pos = _interceptors.indexOf(f);
        if (pos >= 0) {
          _interceptors.splice(pos, 1);
          return true;
        }
        return false;
      }
    },
    set: function(value) {}
  },
  clearStringifyInterceptors: {
    get: function() {
      return function() {
        _interceptors.length = 0;
        return true;
      }
    },
    set: function(value) {}
  },
  stringifyInterceptorCount: {
    get: function() {
      return function() {
        return _interceptors.length;
      }
    },
    set: function(value) {}
  },
  accumulationAppender: {
    get: function() {
      return function(accumulator, mappings, logobj, tags) {
        if (isInvalidHelper(accumulator, mappings, logobj)) return;
        for(var i=0; i<mappings.length; i++) {
          var matchingField = mappings[i].matchingField;
          var pickedFields = mappings[i].selectedFields;
          var counterField = mappings[i].counterField;
          var storageField = mappings[i].storageField;
          var p1 = matchField(logobj[matchingField], mappings[i].filter);
          var p2 = matchTags(tags, mappings[i].anyTags, mappings[i].allTags);
          if (checkConditionals(p1, p2)) {
            if (counterField) {
              accumulator[counterField] = (accumulator[counterField] || 0) + 1;
            }
            if (storageField) {
              accumulator[storageField] = accumulator[storageField] || [];
              if (pickedFields) {
                if (!(pickedFields instanceof Array)) {
                  pickedFields = [pickedFields];
                }
                var output = {};
                pickedFields.forEach(function(field) {
                  output[field] = logobj[field];
                });
                accumulator[storageField].push(output);
              } else {
                accumulator[storageField].push(LogConfig.clone(logobj));
              }
            }
          }
        }
      }
    },
    set: function(value) {}
  },
  setupDefaultInterceptors: {
    get: function() {
      return function(descriptors) {
        LogTracer.clearStringifyInterceptors();
        if (!descriptors instanceof Array) {
          throw new Error('descriptors is not an array');
        }
        descriptors.forEach(function(descriptor, index) {
          if (!descriptor) {
            throw new Error('descriptors['+ index + '] is empty');
          }
          if (!descriptor.accumulator || (typeof descriptor.accumulator !== 'object')) {
            throw new Error('descriptors['+ index + '].accumulator is not an object');
          }
          if (!(descriptor.mappings instanceof Array)) {
            throw new Error('descriptors['+ index + '].mappings is not an array');
          }
          var appender = LogTracer.accumulationAppender.bind(null,
            descriptor.accumulator, descriptor.mappings);
          LogTracer.addStringifyInterceptor(appender);
        });
      }
    },
    set: function(value) {}
  }
});

var checkConditionals = function() {
  var ok = false;
  for(var i =0; i<arguments.length; i++) {
    if (arguments[i] === true) {
      ok = true;
    } else if (arguments[i] === false) {
      ok = false;
      break;
    }
  }
  return ok;
}

var isInvalidHelper = function(counter, mappings, logobj) {
  if (!counter || !(typeof counter === 'object')) return true;
  if (!mappings || !(mappings instanceof Array)) return true;
  if (!logobj || !(typeof logobj === 'object')) return true;
  return false;
}

var hasAnyTags = function(tags, anyTags) {
  if (!(tags instanceof Array)) return false;
  for(var i=0; i<anyTags.length; i++) {
    if (typeof anyTags[i] === 'string') {
      if (tags.indexOf(anyTags[i]) >= 0) return true;
    } else
    if (anyTags[i] instanceof RegExp && tags.some(function(element) {
      return element.match(anyTags[i]) != null;
    })) return true;
  }
  return false;
}

var hasAllTags = function(tags, allTags) {
  if (!(tags instanceof Array)) return false;
  for(var i=0; i<allTags.length; i++) {
    if (typeof allTags[i] === 'string') {
      if (tags.indexOf(allTags[i]) < 0) return false;
    } else
    if (allTags[i] instanceof RegExp) {
      if (tags.every(function(element) {
        return element.match(allTags[i]) == null;
      })) return false;
    } else return false;
  }
  return true;
}

var matchTags = function(tags, anyTags, allTags) {
  if (typeof(tags) === 'string') tags = [tags];
  var passed = null;
  if (passed !== false && anyTags) {
    if (typeof(anyTags) === 'string') anyTags = [anyTags];
    if (anyTags instanceof Array) {
      passed = hasAnyTags(tags, anyTags);
    }
  }
  if (passed !== false && allTags) {
    if (typeof(allTags) === 'string') allTags = [allTags];
    if (allTags instanceof Array) {
      passed = hasAllTags(tags, allTags);
    }
  }
  return passed;
}

var matchField = function(checkpoint, filter) {
  var passed = null;
  if (filter instanceof RegExp) {
    passed = (typeof checkpoint === 'string') && (checkpoint.match(filter) != null);
  } else
  if (filter instanceof Array) {
    passed = (filter.indexOf(checkpoint) >= 0);
  } else
  if (filter instanceof Function) {
    passed = (filter.call(null, checkpoint) == true);
  } else
  if (typeof filter === 'string') {
    passed = (checkpoint == filter);
  }
  return passed;
}

var ROOT = null;

Object.defineProperties(LogTracer, {
  ROOT: {
    get: function() { return ROOT = ROOT || new LogTracer() },
    set: function(val) {}
  },
  reset: {
    get: function() {
      return function() { ROOT = null; return LogTracer; }
    },
    set: function(val) {}
  },
  empty: {
    get: function() {
      return function() {
        Array.prototype.forEach.call(arguments, function(target) {
          if (target && typeof target === 'object') {
            Object.keys(target).forEach(function(fieldName) {
              delete target[fieldName];
            });
          }
        });
        return LogTracer;
      }
    },
    set: function(val) {}
  }
});

module.exports = LogTracer;

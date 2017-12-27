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

  self.reset = function(level) {
    __store = __clearMap(__store);
    __store['message'] = null;
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
    if (LogConfig.IS_FORMATTING_ENABLED && tmpl) {
      msg = LogFormat(tmpl, __store);
    } else {
      if (LogConfig.IS_STRINGIFY_ENABLED || opts.stringify) {
        msg = LogConfig.stringify(__store);
      } else {
        msg = LogConfig.clone(__store);
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
  countLogObject: {
    get: function() {
      return function(counter, mappings, logobj, tags) {
        if (isInvalidHelper(counter, mappings, logobj)) return;
        for(var i=0; i<mappings.length; i++) {
          var sourceField = mappings[i].matchingField;
          var targetField = mappings[i].storageField;
          var p1 = matchField(logobj[sourceField], mappings[i].filter);
          var p2 = matchTags(tags, mappings[i].anyTags, mappings[i].allTags);
          if (p1 === true || p2 === true) {
            counter[targetField] = (counter[targetField] || 0) + 1;
          }
        }
      }
    },
    set: function(value) {}
  },
  extractLogFields: {
    get: function() {
      return function(storage, mappings, logobj, tags) {
        if (isInvalidHelper(storage, mappings, logobj)) return;
        for(var i=0; i<mappings.length; i++) {
          var sourceField = mappings[i].matchingField;
          var pickedFields = mappings[i].selectedFields;
          var targetField = mappings[i].storageField;
          var p1 = matchField(logobj[sourceField], mappings[i].filter);
          var p2 = matchTags(tags, mappings[i].anyTags, mappings[i].allTags);
          if (p1 === true || p2 === true) {
            storage[targetField] = storage[targetField] || [];
            if (pickedFields) {
              if (!(pickedFields instanceof Array)) {
                pickedFields = [pickedFields];
              }
              var output = {};
              pickedFields.forEach(function(field) {
                output[field] = logobj[field];
              });
              storage[targetField].push(output);
            } else {
              storage[targetField].push(LogConfig.clone(logobj));
            }
          }
        }
      }
    },
    set: function(value) {}
  }
});

var isInvalidHelper = function(counter, mappings, logobj) {
  if (!counter || !(typeof counter === 'object')) return true;
  if (!mappings || !(mappings instanceof Array)) return true;
  if (!logobj || !(typeof logobj === 'object')) return true;
  return false;
}

var intersection = function() {
  return Array.from(arguments).reduce(function(previous, current) {
    return previous.filter(function(element) {
      return current.indexOf(element) > -1;
    });
  });
};

var hasAnyTags = function(tags, anyTags) {
  for(var i=0; i<anyTags.length; i++) {
    if (tags.indexOf(anyTags[i]) >= 0) return true;
  }
  return false;
}

var hasAllTags = function(tags, allTags) {
  for(var i=0; i<allTags.length; i++) {
    if (tags.indexOf(allTags[i]) < 0) return false;
  }
  return true;
}

var matchTags = function(tags, anyTags, allTags) {
  var passed = null;
  if (tags) {
    if (typeof(tags) === 'string') tags = [tags];
    if (tags instanceof Array) {
      if (anyTags) {
        if (typeof(anyTags) === 'string') anyTags = [anyTags];
        if (anyTags instanceof Array) {
          passed = hasAnyTags(tags, anyTags);
        }
      }
      if (allTags) {
        if (typeof(allTags) === 'string') allTags = [allTags];
        if (allTags instanceof Array) {
          passed = hasAllTags(tags, allTags);
        }
      }
    }
  }
  return passed;
}

var matchField = function(checkpoint, filter) {
  var passed = null;
  if (filter instanceof RegExp) {
    passed = (typeof checkpoint === 'string') && (checkpoint.match(filter) != null);
  }
  if (filter instanceof Array) passed = (filter.indexOf(checkpoint) >= 0);
  if (filter instanceof Function) passed = filter.call(null, checkpoint);
  if (typeof filter === 'string') passed = (checkpoint == filter);
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
  }
});

module.exports = LogTracer;
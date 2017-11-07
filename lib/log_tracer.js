'use strict';

var misc = require('./log_helper');

var LogTracer = function(params) {
  params = params || {
    key: 'instanceId',
    value: misc.DEFAULT_INSTANCE_ID
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
    var json = null;
    if (misc.IS_STRINGIFY_ENABLED || (opts && opts.stringify)) {
      json = misc.stringify(__store);
    } else {
      json = misc.clone(__store);
    }
    if (misc.IS_INTERCEPTOR_ENABLED) {
      _interceptors.forEach(function(interceptor) {
        interceptor(__store, __key, __value, __parent, opts);
      });
    }
    opts && opts.reset && self.reset();
    return json;
  }

  self.stringify = function(opts) {
    return self.toMessage({stringify: true, reset: opts && opts.reset});
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
      get: function() { return misc.getLogID },
      set: function(value) {}
    }
  });

  self.reset();
}

var _interceptors = [];

Object.defineProperties(LogTracer, {
  getLogID: {
    get: function() { return misc.getLogID },
    set: function(value) {}
  },
  isInterceptorEnabled: {
    get: function() { return misc.IS_INTERCEPTOR_ENABLED },
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
  }
});

var ROOT = null;

Object.defineProperty(LogTracer, 'ROOT', {
  get: function() { return ROOT = ROOT || new LogTracer() },
  set: function(val) {}
});

module.exports = LogTracer;

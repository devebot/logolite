'use strict';

const LogConfig = require('./config');
const LogFormat = require('./format');

const DEFAULT_PARENT_ID_NAME = '_parentId_';
const DEFAULT_NODE_ID_NAME = '_nodeId_';
const DEFAULT_NODE_TYPE_NAME = '_nodeType_';

function LogTracer (params) {
  params = params || {
    key: 'instanceId',
    value: LogConfig.DEFAULT_INSTANCE_ID
  };

  let __parent = params.parent;
  let __key = params.key;
  let __value = params.value;
  let __store = {};
  let __frozen = [];
  let __depth = LogConfig.TRACKING_DEPTH;
  let __predefined = LogConfig.IS_TRACING_ID_PREDEFINED;

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

  this.clear = function() {
    let __storeKeys = Object.keys(__store);
    if (__storeKeys.length > __frozen.length) {
      __storeKeys.forEach(function(fieldName) {
        if (__frozen.indexOf(fieldName) < 0) delete __store[fieldName];
      });
    }
    return this;
  }

  this.reset = function() {
    let self = this;
    __store = __clearMap(__store);
    if (__predefined) {
      if (self.parent) {
        __store[DEFAULT_PARENT_ID_NAME] = self.parent.value;
      }
      __store[DEFAULT_NODE_ID_NAME] = __value;
      __store[DEFAULT_NODE_TYPE_NAME] = __key;
    } else {
      if (__depth == 1) {
        if (self.parent) {
          __store[self.parent.key] = self.parent.value;
        }
      } else if (__depth > 1) {
        let ref = self.parent;
        while (ref) {
          __store[ref.key] = ref.value;
          ref = ref.parent;
        }
      }
      __store[__key] = __value;
    }
    __frozen = Object.keys(__store);
    return this;
  }

  this.branch = function(origin) {
    return new LogTracer({
      parent: this,
      key: origin.key,
      value: origin.value || LogConfig.getLogID()
    });
  }

  this.copy = function() {
    return new LogTracer(this);
  }

  this.get = function(key) {
    return __store[key];
  }

  this.put = function(key, value) {
    if (key && value) __store[key] = value;
    return this;
  }

  this.add = function(map) {
    if (map) {
      Object.keys(map).forEach(function(key) {
        __store[key] = map[key];
      });
    }
    return this;
  }

  this.toMessage = function(opts, mode) {
    opts = opts || {};
    if (LogConfig.IS_FULL_LOG_MODE) {
      // build the #message part
      let note = opts.note;
      if (!note) {
        const template = opts.text || opts.tmpl || opts.template;
        if (template) {
          note = LogFormat(template, __store);
        }
        note = note || 'none';
      }
      // build the #context part
      let strInfo = null;
      if (opts.info) {
        strInfo = LogConfig.stringify(opts.info);
      } else {
        strInfo = LogConfig.stringify(__store);
      }
      // build the #tags part
      let strTags = '[]';
      if (opts.tags) {
        strTags = LogConfig.stringify(opts.tags);
      }
      // build the output message
      let output = note + LogConfig.PREFIX_OF_INFO + strInfo + LogConfig.PREFIX_OF_TAGS + strTags;
      // return / exit
      return output;
    }
    if (mode === 'direct') {
      let tmpl = opts.text || opts.tmpl || opts.template;
      let text = tmpl && LogFormat(tmpl, __store) || LogConfig.stringify(__store);
      if (opts.info) {
        text = text + " - Info: " + LogConfig.stringify(opts.info);
      }
      if (opts.tags) {
        text = text + " - Tags: " + LogConfig.stringify(opts.tags);
      }
      opts.reset && this.reset();
      opts.clear !== false && this.clear();
      return text;
    }
    let output = null, logobj, tags, text;
    if (LogConfig.IS_INTERCEPTOR_ENABLED && _interceptors.length > 0) {
      logobj = LogConfig.clone(__store);
    }
    if (LogConfig.IS_TAGS_EMBEDDABLE || LogConfig.IS_INTERCEPTOR_ENABLED) {
      tags = (opts.tags instanceof Array) && LogConfig.clone(opts.tags);
    }
    if (LogConfig.IS_TEXT_EMBEDDABLE || LogConfig.IS_TEMPLATE_APPLIED) {
      let tmpl = opts.text || opts.tmpl || opts.template;
      text = tmpl && LogFormat(tmpl, __store);
    }
    if (LogConfig.IS_TAGS_EMBEDDABLE && tags) {
      __store[LogConfig.TAGS_FIELD_NAME] = tags;
    }
    if (LogConfig.IS_TEXT_EMBEDDABLE && text) {
      __store[LogConfig.TEXT_FIELD_NAME] = text;
    }
    if (LogConfig.IS_STRINGIFY_ENABLED || opts.stringify) {
      if (LogConfig.IS_TEMPLATE_APPLIED && text) {
        output = text;
      } else {
        output = LogConfig.stringify(__store);
      }
    } else {
      output = LogConfig.clone(__store);
    }
    if (LogConfig.IS_INTERCEPTOR_ENABLED && _interceptors.length > 0) {
      if (LogConfig.IS_TAGS_EMBEDDABLE && tags) {
        logobj[LogConfig.TAGS_FIELD_NAME]= tags;
      }
      if (LogConfig.IS_TEXT_EMBEDDABLE && text) {
        logobj[LogConfig.TEXT_FIELD_NAME]= text;
      }
      _interceptors.forEach(function(interceptor) {
        interceptor(logobj, tags, __key, __value, __parent);
      });
    }
    opts.reset && this.reset();
    (opts.clear !== false) && this.clear();
    return output;
  }

  this.stringify = function(opts) {
    opts = opts || {};
    opts.stringify = true;
    return this.toMessage(opts);
  }

  this.toString = function(opts) {
    return this.stringify(opts);
  }

  let __clearMap = function(map) {
    Object.keys(map).forEach(function(key) {
      delete map[key];
    });
    return map;
  }

  Object.defineProperties(this, {
    getLogID: {
      get: function() { return LogConfig.getLogID },
      set: function(value) {}
    }
  });

  this.reset();
}

let _interceptors = [];

Object.defineProperties(LogTracer, {
  getLogID: {
    get: function() { return LogConfig.getLogID },
    set: function(value) {}
  },
  isInterceptorEnabled: {
    get: function() { return LogConfig.IS_INTERCEPTOR_ENABLED },
    set: function(value) {}
  },
  addInterceptor: {
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
  removeInterceptor: {
    get: function() {
      return function(f) {
        let pos = _interceptors.indexOf(f);
        if (pos >= 0) {
          _interceptors.splice(pos, 1);
          return true;
        }
        return false;
      }
    },
    set: function(value) {}
  },
  clearInterceptors: {
    get: function() {
      return function() {
        _interceptors.length = 0;
        return true;
      }
    },
    set: function(value) {}
  },
  countInterceptors: {
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
        for (let i=0; i<mappings.length; i++) {
          if (!mappings[i].matchingPath) {
            if (typeof mappings[i].matchingField === 'string') {
              mappings[i].matchingPath = mappings[i].matchingField.split(',')
                  .map(function(part) {
                    return part.trim();
                  });
            }
            if (mappings[i].matchingField instanceof Array) {
              mappings[i].matchingPath = mappings[i].matchingField;
            }
          }
          let pickedFields = mappings[i].selectedFields;
          let counterField = mappings[i].countTo || mappings[i].counterField;
          let storageField = mappings[i].storeTo || mappings[i].storageField;
          let p1 = matchField(mappings[i].matchingRule, mappings[i].matchingPath, logobj);
          let p2 = matchTags(mappings[i].anyTags, mappings[i].allTags, tags);
          let p3 = matchFilter(mappings[i].filter, logobj, tags);
          if (checkConditionals(p1, p2, p3)) {
            if (counterField) {
              accumulator[counterField] = (accumulator[counterField] || 0) + 1;
            }
            if (storageField) {
              accumulator[storageField] = accumulator[storageField] || [];
              if (pickedFields && logobj) {
                if (!(pickedFields instanceof Array)) {
                  pickedFields = [pickedFields];
                }
                let output = {};
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
        LogTracer.clearInterceptors();
        if (!(descriptors instanceof Array)) {
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
          let appender = LogTracer.accumulationAppender.bind(null,
            descriptor.accumulator, descriptor.mappings);
          LogTracer.addInterceptor(appender);
        });
      }
    },
    set: function(value) {}
  }
});

let checkConditionals = function() {
  let ok = false;
  for (let i =0; i<arguments.length; i++) {
    if (arguments[i] === true) {
      ok = true;
    } else if (arguments[i] === false) {
      ok = false;
      break;
    }
  }
  return ok;
}

let isInvalidHelper = function(counter, mappings, logobj) {
  if (!counter || !(typeof counter === 'object')) return true;
  if (!mappings || !(mappings instanceof Array)) return true;
  if (!logobj || !(typeof logobj === 'object')) return true;
  return false;
}

let hasAnyTags = function(tags, anyTags) {
  if (!(tags instanceof Array)) return false;
  for (let i=0; i<anyTags.length; i++) {
    if (typeof anyTags[i] === 'string') {
      if (tags.indexOf(anyTags[i]) >= 0) return true;
    } else
    if (anyTags[i] instanceof RegExp && tags.some(function(element) {
      return element.match(anyTags[i]) != null;
    })) return true;
  }
  return false;
}

let hasAllTags = function(tags, allTags) {
  if (!(tags instanceof Array)) return false;
  for (let i=0; i<allTags.length; i++) {
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

let matchTags = function(anyTags, allTags, tags) {
  if (typeof(tags) === 'string') tags = [tags];
  let passed = null;
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

let matchField = function(matchingRule, fieldPath, object) {
  let passed = null;
  if (!(object && typeof(object) === 'object' && fieldPath instanceof Array)) return passed;
  let fieldValue = object;
  for (let i=0; i<fieldPath.length; i++) {
    fieldValue = fieldValue && fieldValue[fieldPath[i]];
  }
  if (matchingRule instanceof RegExp) {
    passed = (typeof fieldValue === 'string') && (fieldValue.match(matchingRule) != null);
  } else
  if (matchingRule instanceof Array) {
    passed = (matchingRule.indexOf(fieldValue) >= 0);
  } else
  if (matchingRule instanceof Function) {
    passed = (matchingRule(fieldValue) == true);
  } else
  if (typeof matchingRule === 'string') {
    passed = (fieldValue == matchingRule);
  }
  return passed;
}

let matchFilter = function(filter, packet, tags) {
  let passed = null;
  if (filter instanceof Function) {
    passed = (filter(packet, tags) == true);
  }
  return passed;
}

let ROOT = null;

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

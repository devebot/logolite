'use strict';

var argPattern = /(\{|\$\{)[\s]*([a-zA-Z_][0-9a-zA-Z_\.]*[0-9a-zA-Z_])[\s]*(\})/g;
var notFoundValue = process.env.LOGOLITE_FORMAT_NOT_FOUND_VALUE || 'not_found_value';
var stringifyFailed = process.env.LOGOLITE_STRINGIFY_FAILED_VALUE || 'stringify_failed';

var transform = function(tmpl) {
  var args;

  if (arguments.length === 2 && typeof(arguments[1]) === "object") {
    args = arguments[1];
  } else {
    args = new Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; ++i) {
      args[i - 1] = arguments[i];
    }
  }
  if (!args || !args.hasOwnProperty) args = {};

  return tmpl.replace(argPattern, function argReplacer(m, b, t, e, i) {
    if (tmpl[i - 1] === "{" && b === "{" && e === "}" && tmpl[i + m.length] === "}") {
      return t; // transform {{ variable }} to {variable}
    } else {
      var result = args.hasOwnProperty(t) ? args[t] : null;
      if (result === null || result === undefined) {
        var p = t.split('.');
        if (p.length > 1) {
          result = p.reduce(function(acc, n) {
            return acc && acc.hasOwnProperty(n) ? acc[n] : null;
          }, args);
        }
      }
      if (result === null || result === undefined) return notFoundValue;
      if (typeof result === "object") return stringify(result);
      return result;
    }
  });
}

var stringify = function(obj) {
  try {
    return JSON.stringify(obj);
  } catch (err) {}
  return stringifyFailed;
}

module.exports = transform;

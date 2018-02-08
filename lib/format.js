'use strict';

var argPattern = /(\{|\$\{)[\s]*([a-zA-Z_][0-9a-zA-Z_\.]*[0-9a-zA-Z_])[\s]*(\})/g;
var notFoundValue = process.env.LOGOLITE_NOT_FOUND_VALUE || 'not_found_value';

function template(string) {
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

  return string.replace(argPattern, function argReplacer(match, b, i, e, index) {
    if (string[index - 1] === "{" && string[index + match.length] === "}") {
      return i; // transform {{ variable }} to {variable}
    } else {
      var result = args.hasOwnProperty(i) ? args[i] : null;
      if (result === null || result === undefined) {
        var p = i.split('.');
        if (p.length > 1) {
          result = p.reduce(function(acc, n) {
            return acc && acc.hasOwnProperty(n) ? acc[n] : null;
          }, args);
        }
      }
      if (result === null || result === undefined) {
        return notFoundValue;
      }
      if (typeof result === "object" || result instanceof Array) {
        return stringify(result);
      }
      return result;
    }
  });
}

function stringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (err) {}
  return notFoundValue;
}

module.exports = template;

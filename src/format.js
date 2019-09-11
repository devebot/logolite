'use strict';

const argPattern = /(\{|\$\{|\#\{)[\s]*([0-9]+|[a-zA-Z_][0-9a-zA-Z_\.]*[0-9a-zA-Z_])[\s]*(\})/g;
const notFoundValue = process.env.LOGOLITE_FORMAT_NOT_FOUND_VALUE || 'not_found_value';
const stringifyFailed = process.env.LOGOLITE_STRINGIFY_FAILED_VALUE || 'stringify_failed';

function transform (tmpl) {
  let args;

  if (arguments.length === 2 && typeof(arguments[1]) === "object") {
    args = arguments[1];
  } else {
    args = Array.prototype.slice.call(arguments, 1);
  }
  if (!args || !args.hasOwnProperty) args = {};

  return tmpl.replace(argPattern, function argReplacer(m, b, t, e, i) {
    if (tmpl[i - 1] === "{" && b === "{" && tmpl[i + m.length] === "}") {
      return t; // transform {{variable}} to {variable}
    } else
    if (tmpl[i - 1] === "$" && b === "${") {
      return "{" + t + "}"; // transform $${variable} to ${variable}
    } else
    if (tmpl[i - 1] === "#" && b === "#{") {
      return "{" + t + "}"; // transform ##{variable} to #{variable}
    } else {
      let result = args.hasOwnProperty(t) ? args[t] : null;
      if (result === null || result === undefined) {
        let p = t.split('.');
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

function stringify (obj) {
  try {
    return JSON.stringify(obj);
  } catch (err) {}
  return stringifyFailed;
}

module.exports = transform;

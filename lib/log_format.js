'use strict';

var nargs = /\{([0-9a-zA-Z_]+)\}/g;

function template(string) {
  var args

  if (arguments.length === 2 && typeof arguments[1] === "object") {
    args = arguments[1];
  } else {
    args = new Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; ++i) {
      args[i - 1] = arguments[i];
    }
  }

  if (!args || !args.hasOwnProperty) {
    args = {};
  }

  return string.replace(nargs, function replaceArg(match, i, index) {
    var result;

    if (string[index - 1] === "{" &&
      string[index + match.length] === "}") {
      return i;
    } else {
      result = args.hasOwnProperty(i) ? args[i] : null;
      if (result === null || result === undefined) {
        return "";
      }
      if (typeof result === "object") {
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
  return null;
}

module.exports = template;
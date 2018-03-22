'use strict';

var dbg = require('debug')('logolite:envtool');

function isBrowser() {
  return (typeof global.process === 'undefined' || global.process.type === 'renderer');
}

function getLocalStorage() {
  return 'undefined' != typeof global.chrome && 'undefined' != typeof global.chrome.storage
    ? global.chrome.storage.local
    : (function() {
      try {
        return global.window.localStorage;
      } catch (e) {}
    })();
}

var browserStorage;

function getEnvOpt(varName) {
  var v;

  if (isBrowser()) {
    browserStorage = browserStorage || getLocalStorage();
    false && dbg.enabled && dbg(' - localStorage: %s', JSON.stringify(browserStorage));
    if (browserStorage) {
      try {
        v = browserStorage[varName];
      } catch(e) {}
    }
    dbg.enabled && dbg(' - get ENVOPT[%s] from localStorage: %s', varName, v);
  } else {
    v = global.process.env[varName];
    dbg.enabled && dbg(' - get ENVOPT[%s] from process object: %s', varName, v);
  }

  return v;
}

module.exports = {isBrowser: isBrowser, getEnvOpt: getEnvOpt};

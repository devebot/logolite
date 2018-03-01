'use strict';

function isBrowser() {
  return (typeof process === 'undefined' || process.type === 'renderer');
}

function getLocalStorage() {
  return 'undefined' != typeof chrome && 'undefined' != typeof chrome.storage
    ? chrome.storage.local
    : (function() {
      try {
        return window.localStorage;
      } catch (e) {}
    })();
}

var browserStorage;

function getEnvOpt(varName) {
  var v;

  if (isBrowser()) {
    browserStorage = browserStorage || getLocalStorage();
    if (browserStorage) {
      try {
        v = browserStorage[varName];
      } catch(e) {}
    }
  } else {
    v = process.env[varName];
  }

  return v;
}

module.exports = {isBrowser: isBrowser, getEnvOpt: getEnvOpt};

// Initialize browser instance
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  globalThis.browser = chrome;
}

// Initialize webpack loader once per module to handle script loading
if (__webpack_require__.l && !__webpack_require__.l.origin) {
  function initializeWebpackLoader() {
    if (!browser.runtime) return;
    const inProgress = {};

    __webpack_require__.l.origin = __webpack_require__.l;
    __webpack_require__.l = (url, done) => {
      if (inProgress[url]) {
        inProgress[url].push(done);
        return;
      }

      inProgress[url] = [done];
      const onScriptComplete = (event) => {
        const doneFns = inProgress[url];
        delete inProgress[url];
        doneFns?.forEach((fn) => fn(event));
      };
      const CHUNK_LOAD_TIMEOUT = 120000;
      setTimeout(onScriptComplete, CHUNK_LOAD_TIMEOUT);

      browser.runtime
        .sendMessage({ type: 'web-extend-execute-script', url })
        .then(onScriptComplete)
        .catch(onScriptComplete);
    };
  }

  initializeWebpackLoader();
}

// Initialize reload handler once per window instance
if (!window.__WEB_EXTEND_RELOAD_INIT__) {
  window.__WEB_EXTEND_RELOAD_INIT__ = true;

  function reloadExtension() {
    if (!browser.runtime) return;
    browser.runtime.sendMessage({ type: 'web-extend-reload-extension' });
  }

  window.addEventListener('beforeunload', reloadExtension);
}
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
        const code = typeof event === 'object' && event !== null ? event.code : undefined;
        if (code === 0) {
          console.log('[HMR] loaded.');
        } else {
          console.log('[HMR] failed', event);
        }

        const doneFns = inProgress[url];
        delete inProgress[url];
        doneFns?.forEach((fn) => fn(event));
      };
      const CHUNK_LOAD_TIMEOUT = 120000;
      setTimeout(onScriptComplete, CHUNK_LOAD_TIMEOUT);

      const file = url?.split('/').at(-1);
      if (file) {
        console.log(`[HMR] fetching script ${file}.`);
        browser.runtime
          .sendMessage({ type: 'web-extend:execute-script', file })
          .then(onScriptComplete)
          .catch(onScriptComplete);
      }
    };
  }

  initializeWebpackLoader();
}

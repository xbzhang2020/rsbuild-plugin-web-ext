// init only once
if (__webpack_require__.l && !__webpack_require__.l.origin) {
  if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
    globalThis.browser = chrome;
  }

  if (typeof browser !== 'undefined' && browser.runtime) {
    const inProgress = {};

    __webpack_require__.l.origin = __webpack_require__.l;
    __webpack_require__.l = (url, done, key, chunkId) => {
      if (inProgress[url]) {
        inProgress[url].push(done);
        return;
      }
      inProgress[url] = [done];
      let timeout = undefined;
      const CHUNK_LOAD_TIMEOUT = 120000;
      const onScriptComplete = (event) => {
        clearTimeout(timeout);
        const doneFns = inProgress[url];
        delete inProgress[url];
        doneFns?.forEach((fn) => fn(event));
      };
      timeout = setTimeout(onScriptComplete, CHUNK_LOAD_TIMEOUT);

      browser.runtime.sendMessage({ type: '_executeScript', url }).then(onScriptComplete).catch(onScriptComplete);
    };
  }
}

if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  globalThis.browser = chrome;
}

if (typeof browser !== 'undefined' && browser.runtime) {
  browser.runtime.sendMessage({ type: '_reload' });
}

// Initialize reload handler once per window instance
if (!window.__WEB_EXTEND_RELOAD_INIT__) {
  window.__WEB_EXTEND_RELOAD_INIT__ = true;

  function reloadExtension() {
    if (!browser.runtime) return;
    browser.runtime.sendMessage({ type: 'web-extend-reload-extension' });
  }

  window.addEventListener('beforeunload', reloadExtension);
}

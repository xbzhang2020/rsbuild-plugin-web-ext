if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  globalThis.browser = chrome;
}

if (typeof browser !== 'undefined') {
  browser.commands.onCommand.addListener((command) => {
    if (command === 'web-ext-reload-extension') {
      browser.runtime.reload();
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (typeof message !== 'object') return;

    if (message.type === 'web-ext-reload-extension') {
      browser.runtime.reload();
      sendResponse({ type: 'ok' });
      return;
    }

    if (message.type === 'web-ext-execute-script') {
      const tabId = sender.tab?.id;
      const file = message.url?.split('/').at(-1);
      if (tabId && file) {
        browser.scripting
          .executeScript({
            target: { tabId },
            files: [file],
          })
          .then(() => {
            sendResponse({ type: 'ok' });
          })
          .catch(() => {
            sendResponse({ type: 'failed' });
          });
      }
      return true;
    }
  });
}

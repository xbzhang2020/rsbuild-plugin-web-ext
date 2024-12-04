if (module?.hot) {
  module.hot.addStatusHandler((status) => {
    if (status === 'check') {
      // TODO: 适配 Firefox
      chrome.runtime.sendMessage({
        action: 'reload-extenison',
      });
    }
  });
}

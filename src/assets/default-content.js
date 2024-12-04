if (module.hot) {
  module.hot.addStatusHandler((status) => {
    if (status === 'check') {
      chrome.runtime.sendMessage({
        action: 'reload-extenison',
      });
    }
  });
}

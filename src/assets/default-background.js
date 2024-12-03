chrome.runtime.onMessage.addListener((message) => {
  if (message?.action === 'reload-extenison') {
    chrome.runtime.reload();
  }
});

import './content.css';

console.log('content');

export const config = {
  matches: ['<all_urls>'],
};

if (module?.hot) {
  module.hot.addStatusHandler((status) => {
    if (status === 'check') {
      chrome.runtime.sendMessage({
        action: 'reload-extenison',
      });
    }
  });
}

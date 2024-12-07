import './content.css';

console.log('content2');

setTimeout(() => {
  const btn = document.createElement('button');
  btn.style.position = 'fixed';
  btn.style.top = '300px';
  btn.style.left = '300px';
  btn.innerText = 'Click';
  btn.style.padding = '4px 12px';
  btn.onclick = async () => {
    console.log('test runtime', chrome.runtime);
  };
  document.body.appendChild(btn);
}, 0);

export const config = {
  matches: ['https://www.baidu.com/'],
  world: 'ISOLATED',
};

if (module.hot) {
  module.hot.accept();
}

import './content.css';

console.log('content');

export const config = {
  matches: ['https://www.baidu.com/'],
};

if (module.hot) {
  module.hot.accept();
}

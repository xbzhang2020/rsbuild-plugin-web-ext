import './content.css';
import type { ContentScriptConfig } from '../../lib';
import './env.d.ts';

console.log('content1');

// see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
export const config: ContentScriptConfig = {
  matches: ['https://www.baidu.com//*'],
};

// support hmr in dev mode
if (module.hot) {
  module.hot.accept();
}

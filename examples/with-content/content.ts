import './content.css';
import type { ContentScriptConfig } from '../../src/index';
import './env.d';

console.log('content2');

// see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
export const config: ContentScriptConfig = {
  matches: ['https://developer.mozilla.org/*'],
};

// support hmr in dev mode
if (module.hot) {
  module.hot.accept();
}

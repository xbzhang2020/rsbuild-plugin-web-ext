import './content.css';
import type { ContentScriptConfig } from '../../src/index';

console.log('content');

// see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
export const config: ContentScriptConfig = {
  matches: ['https://developer.mozilla.org/*'],
};

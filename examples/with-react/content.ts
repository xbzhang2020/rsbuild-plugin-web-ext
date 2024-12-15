import { createRoot } from './src/index';
import type { ContentScriptConfig } from '../lib';

const root = document.createElement('div');
root.style.position = 'fixed';
root.style.left = '12px';
root.style.top = '12px';
root.style.zIndex = '9999';
document.body.appendChild(root);

createRoot(root);

export const config: ContentScriptConfig = {
  matches: ['https://developer.mozilla.org/*'],
};

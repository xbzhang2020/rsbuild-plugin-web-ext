import type { ContentScriptConfig } from 'rsbuild-plugin-web-ext';

console.log('Hello, content.');

export const config: ContentScriptConfig = {
  matches: ['https://developer.mozilla.org/*'],
};

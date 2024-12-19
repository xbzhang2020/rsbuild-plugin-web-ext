import { defineConfig } from '@rsbuild/core';
import { pluginWebExt } from '../../src/index.js';

export default defineConfig({
  // mode: 'development',
  plugins: [pluginWebExt({
    target: 'firefox-mv2'
  })],
  output: {
    distPath: {
      root: 'dist/firefox-mv2-prod',
    },
  },
});

import { defineConfig } from '@rsbuild/core';
import { pluginWebExt } from '../lib';

export default defineConfig({
  plugins: [
    pluginWebExt({
      target: 'chrome-mv3',
    }),
  ],
  dev: {
    liveReload: false,
  },
});

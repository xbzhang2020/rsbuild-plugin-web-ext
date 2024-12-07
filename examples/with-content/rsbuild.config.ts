import { defineConfig } from '@rsbuild/core';
import { pluginWebExt } from '../../src';
import manifest from './manifest';

export default defineConfig({
  plugins: [
    pluginWebExt({
      manifest,
    }),
  ],
  dev: {
    liveReload: false,
  },
});

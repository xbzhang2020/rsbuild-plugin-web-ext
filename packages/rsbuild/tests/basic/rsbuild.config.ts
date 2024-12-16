import { defineConfig } from '@rsbuild/core';
import { pluginWebExt } from '../../src/index.js';

export default defineConfig({
  plugins: [pluginWebExt()],
});

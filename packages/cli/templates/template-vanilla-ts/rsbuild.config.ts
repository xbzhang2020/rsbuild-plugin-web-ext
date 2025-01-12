import { defineConfig } from '@rsbuild/core';
import { pluginWebExt } from 'rsbuild-plugin-web-ext';

export default defineConfig({
  plugins: [pluginWebExt()],
});

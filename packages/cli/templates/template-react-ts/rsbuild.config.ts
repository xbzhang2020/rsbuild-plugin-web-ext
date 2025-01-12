import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginWebExt } from 'rsbuild-plugin-web-ext';

export default defineConfig({
  plugins: [pluginReact(), pluginWebExt()],
});

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginWebExt } from '../lib';

export default defineConfig({
  plugins: [pluginReact(), pluginWebExt()],
});

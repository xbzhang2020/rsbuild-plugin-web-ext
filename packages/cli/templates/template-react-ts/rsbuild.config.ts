import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginWebExt } from '../../../rsbuild/dist/index.js';

export default defineConfig({
  plugins: [pluginReact(), pluginWebExt()],
});

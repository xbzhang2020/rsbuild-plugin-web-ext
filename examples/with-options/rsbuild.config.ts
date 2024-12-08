import { defineConfig } from '@rsbuild/core';
import { pluginWebExt } from '../../src';

export default defineConfig({
  plugins: [pluginWebExt({})],
});

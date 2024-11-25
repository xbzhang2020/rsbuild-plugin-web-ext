import type { RsbuildPlugin } from '@rsbuild/core';

export type pluginWebExtOptions = {
  foo?: string;
  bar?: boolean;
};

export const pluginWebExt = (
  options: pluginWebExtOptions = {},
): RsbuildPlugin => ({
  name: 'plugin-web-ext',

  setup() {
    console.log('Hello Rsbuild!', options);
  },
});

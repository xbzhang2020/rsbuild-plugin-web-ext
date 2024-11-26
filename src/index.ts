import { cp, writeFile } from 'node:fs/promises';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { ManifestV3 } from '../types/index.js';
import { collectEntries, modifyManifestEntries, processManifestIcons } from './process.js';

export type PluginWebExtOptions = {
  manifest?: ManifestV3;
};

export const pluginWebExt = (options: PluginWebExtOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',

  setup: (api) => {
    const { manifest } = options;
    if (!manifest) return;

    const env = process.env.NODE_ENV;
    let myManifest = {
      ...(manifest || {}),
    };

    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const extraConfig: RsbuildConfig = {
        source: {
          entry: collectEntries(manifest),
        },
        dev: {
          writeToDisk: true,
        },
        performance: {
          chunkSplit: {
            // background
            strategy: 'all-in-one',
          },
        },
      };

      return mergeRsbuildConfig(config, extraConfig);
    });

    api.onAfterEnvironmentCompile(async ({ stats, environment }) => {
      if (env === 'development') {
        myManifest.version_name = 'development';
      }

      myManifest = modifyManifestEntries(myManifest, stats);

      const outDir = environment.distPath;

      // icons
      await processManifestIcons(myManifest, outDir);

      // manifest.json
      await writeFile(`${outDir}/manifest.json`, JSON.stringify(myManifest));
      console.log('Built the extension successfully');
    });
  },
});

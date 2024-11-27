import { writeFile } from 'node:fs/promises';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { ManifestV3 } from './process.js';
import {
  collectManifestEntries,
  modifyManifestEntries,
  processManifestIcons,
  processWebAccessibleResources,
} from './process.js';

export type PluginWebExtOptions = {
  manifest?: unknown;
};

export const pluginWebExt = (options: PluginWebExtOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',

  setup: (api) => {
    const { manifest } = options;
    if (!manifest) return;

    let myManifest = manifest as ManifestV3;

    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const imagePath = config.output?.distPath?.image || 'static/image';

      const extraConfig: RsbuildConfig = {
        source: {
          entry: collectManifestEntries(myManifest),
        },
        output: {
          copy: [...processManifestIcons(myManifest, imagePath), ...processWebAccessibleResources(myManifest)],
        },
        dev: {
          writeToDisk: true,
          // TODO: error in dev
          hmr: false,
          liveReload: false,
        },
        performance: {
          chunkSplit: {
            // TODO: for background, need optimization
            strategy: 'all-in-one',
          },
        },
      };

      return mergeRsbuildConfig(extraConfig, config);
    });

    api.onAfterEnvironmentCompile(async ({ stats, environment }) => {
      myManifest = modifyManifestEntries(myManifest, stats);

      await writeFile(`${environment.distPath}/manifest.json`, JSON.stringify(myManifest));
      console.log('Built the extension successfully');
    });
  },
});

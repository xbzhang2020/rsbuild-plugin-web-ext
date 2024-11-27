import { writeFile } from 'node:fs/promises';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { ManifestV3 } from './process.js';
import {
  collectManifestEntries,
  modifyManifestEntries,
  processManifestIcons,
  processManifestLocales,
  processManifestWebAccessibleResources,
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
          copy: [
            ...processManifestIcons(myManifest, imagePath),
            ...processManifestWebAccessibleResources(myManifest),
            ...processManifestLocales(myManifest),
          ],
        },
        dev: {
          writeToDisk: (file) => !file.includes('.hot-update.'),
        },
        performance: {
          chunkSplit: {
            // TODO: for background, need optimization
            strategy: 'all-in-one',
          },
        },
      };

      return mergeRsbuildConfig(config, extraConfig);
    });

    api.onAfterEnvironmentCompile(async ({ stats, environment }) => {
      myManifest = modifyManifestEntries(myManifest, stats);

      await writeFile(`${environment.distPath}/manifest.json`, JSON.stringify(myManifest));
      console.log('Built the extension successfully');
    });
  },
});

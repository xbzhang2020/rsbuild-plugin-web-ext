import { writeFile } from 'node:fs/promises';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { ManifestV3 } from './manifest.js';
import {
  mergeManifestEntries,
  readManifestEntries,
  writeManifestEntries,
  copyIcons,
  copyWebAccessibleResources,
  copyLocales,
} from './process/index.js';

export type PluginWebExtOptions = {
  manifest?: unknown;
};

export const pluginWebExt = (options: PluginWebExtOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',

  setup: (api) => {
    const { manifest } = options;
    if (!manifest) return;

    const myManifest = manifest as ManifestV3;

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      await mergeManifestEntries(api.context.rootPath, myManifest);

      const imagePath = config.output?.distPath?.image || 'static/image';
      const { background, ...entries } = readManifestEntries(myManifest);
      const environments: RsbuildConfig['environments'] = {};

      if (background) {
        environments.webWorker = {
          source: {
            entry: { background },
          },
          output: {
            target: 'web-worker',
          },
        };
      }

      if (Object.keys(entries).length) {
        environments.web = {
          source: {
            entry: entries,
          },
          output: {
            target: 'web',
          },
        };
      }

      const defaultEnvironment = environments.web || environments.webWorker;
      if (defaultEnvironment?.output) {
        defaultEnvironment.output.copy = [
          ...copyIcons(myManifest, imagePath),
          ...copyWebAccessibleResources(myManifest),
          ...copyLocales(myManifest),
        ];
      }

      const extraConfig: RsbuildConfig = {
        environments,
        dev: {
          writeToDisk: (file) => !file.includes('.hot-update.'),
        },
      };

      return mergeRsbuildConfig(config, extraConfig);
    });

    api.onAfterEnvironmentCompile(({ stats }) => {
      writeManifestEntries(myManifest, stats);
    });

    api.onAfterBuild(async () => {
      const config = api.getNormalizedConfig();
      const distPath = config.output.distPath.root;
      await writeFile(`${distPath}/manifest.json`, JSON.stringify(myManifest));
      console.log('Built the extension successfully');
    });

    api.onDevCompileDone(async () => {
      const config = api.getNormalizedConfig();
      const distPath = config.output.distPath.root;
      await writeFile(`${distPath}/manifest.json`, JSON.stringify(myManifest));
      console.log('Built the extension successfully');
    });
  },
});

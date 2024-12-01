import { writeFile } from 'node:fs/promises';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { ManifestV3, ContentConfig } from './manifest.js';
import {
  getDefaultManifest,
  copyIcons,
  copyLocales,
  copyWebAccessibleResources,
  mergeManifestEntries,
  readManifestEntries,
  writeManifestEntries,
} from './process/index.js';

export type PluginWebExtOptions = {
  manifest?: unknown;
};

export type ContentScriptConfig = ContentConfig;

export const pluginWebExt = (options: PluginWebExtOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',

  setup: (api) => {
    let finalManifest = {} as ManifestV3;

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      const rootPath = api.context.rootPath;

      const defaultManifest = await getDefaultManifest(rootPath);
      finalManifest = {
        ...defaultManifest,
        ...(options.manifest as ManifestV3),
      };
      await mergeManifestEntries(rootPath, finalManifest);

      const imagePath = config.output?.distPath?.image || 'static/image';
      const { background, ...entries } = readManifestEntries(finalManifest);
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
          ...copyIcons(finalManifest, imagePath),
          ...copyWebAccessibleResources(finalManifest),
          ...copyLocales(finalManifest),
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
      writeManifestEntries(finalManifest, stats);
    });

    api.onAfterBuild(async () => {
      const config = api.getNormalizedConfig();
      const distPath = config.output.distPath.root;
      await writeFile(`${distPath}/manifest.json`, JSON.stringify(finalManifest));
      console.log('Built the extension successfully');
    });

    api.onDevCompileDone(async () => {
      const config = api.getNormalizedConfig();
      const distPath = config.output.distPath.root;
      await writeFile(`${distPath}/manifest.json`, JSON.stringify(finalManifest));
      console.log('Built the extension successfully');
    });
  },
});

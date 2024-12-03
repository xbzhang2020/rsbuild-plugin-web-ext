import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { ContentConfig, ManifestV3 } from './manifest.js';
import {
  copyIcons,
  copyLocales,
  copyWebAccessibleResources,
  readManifestEntries,
  writeManifestEntries,
  normalizeManifest,
} from './process/index.js';

export type PluginWebExtOptions = {
  manifest?: unknown;
  srcDir?: string;
};

export type ContentScriptConfig = ContentConfig;

export const pluginWebExt = (options: PluginWebExtOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',

  setup: (api) => {
    const rootPath = api.context.rootPath;
    const srcPath = resolve(rootPath, options.srcDir || './');
    let manifest = {} as ManifestV3;

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      manifest = await normalizeManifest({ manifest: options.manifest as ManifestV3, srcPath, rootPath });

      const { background, ...entries } = readManifestEntries(manifest);
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

      let defaultEnvironment = environments.web || environments.webWorker;
      if (!defaultEnvironment) {
        // should provide an entry at least.
        defaultEnvironment = environments.web = {
          source: {
            entry: {
              index: {
                import: [],
                html: false,
              },
            },
          },
        };
      }

      if (defaultEnvironment?.output) {
        const imagePath = config.output?.distPath?.image || 'static/image';
        defaultEnvironment.output.copy = [
          ...copyIcons(manifest, imagePath),
          ...copyWebAccessibleResources(manifest),
          ...copyLocales(manifest),
        ];
      }

      const extraConfig: RsbuildConfig = {
        environments,
        dev: {
          writeToDisk: (file) => !file.includes('.hot-update.'),
        },
      };

      return mergeRsbuildConfig(extraConfig, config);
    });

    api.onAfterEnvironmentCompile(async (params) => {
      await writeManifestEntries(manifest, {
        ...params,
        originManifest: options.manifest as ManifestV3,
      });
    });

    api.onAfterBuild(async () => {
      const distPath = api.getNormalizedConfig().output.distPath.root;
      await writeFile(`${distPath}/manifest.json`, JSON.stringify(manifest));
      console.log('Built the extension successfully');
    });

    api.onDevCompileDone(async () => {
      const distPath = api.getNormalizedConfig().output.distPath.root;
      await writeFile(`${distPath}/manifest.json`, JSON.stringify(manifest));
      console.log('Built the extension successfully');
    });
  },
});

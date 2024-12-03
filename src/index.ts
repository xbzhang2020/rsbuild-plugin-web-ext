import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildEntry, RsbuildPlugin } from '@rsbuild/core';
import type { ContentConfig, ManifestV3 } from './manifest.js';
import {
  copyIcons,
  copyLocales,
  copyWebAccessibleResources,
  normalizeManifest,
  readManifestEntries,
  writeManifestEntries,
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

      const environments: RsbuildConfig['environments'] = {};
      const { background, ...otherEntries } = readManifestEntries(manifest);
      const isDev = process.env.NODE_ENV === 'development';

      if (background || isDev) {
        const defaultBackgound = resolve(__dirname, './assets/default-background.js');
        const backgrounds = Array.isArray(background) ? background : [background];
        environments.webWorker = {
          source: {
            entry: {
              background: {
                import: [defaultBackgound, ...backgrounds],
                html: false,
              },
            },
          },
          output: {
            target: 'web-worker',
          },
        };
      }

      if (Object.keys(otherEntries).length) {
        const entry = Object.keys(otherEntries).reduce((entry, key) => {
          entry[key] = {
            import: otherEntries[key],
            html: ['popup', 'devtools', 'options'].includes(key) || key.startsWith('sandbox'),
          };
          return entry;
        }, {} as RsbuildEntry);

        environments.web = {
          source: {
            entry,
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

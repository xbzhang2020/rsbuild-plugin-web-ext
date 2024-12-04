import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { ContentConfig, ManifestV3 } from './manifest.js';
import {
  copyIcons,
  copyLocales,
  copyWebAccessibleResources,
  getRsbuildEntryFile,
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
    const selfRootPath = __dirname;
    let manifest = {} as ManifestV3;

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      manifest = await normalizeManifest({
        manifest: options.manifest as ManifestV3,
        srcPath: resolve(rootPath, options.srcDir || './'),
        rootPath,
        selfRootPath,
      });

      const { background, ...webEntries } = readManifestEntries(manifest);
      const environments: RsbuildConfig['environments'] = {};
      if (background) {
        environments.webWorker = {
          source: {
            entry: {
              background,
            },
          },
          output: {
            target: 'web-worker',
          },
        };
      }

      if (Object.keys(webEntries).length) {
        environments.web = {
          source: {
            entry: webEntries,
          },
          output: {
            target: 'web',
          },
        };
      }

      if (!environments.webWorker || !environments.web) {
        // should provide an entry at least.
        environments.web = {
          source: {
            entry: {
              empty: {
                import: [],
                html: false,
              },
            },
          },
        };
      }

      const defaultEnvironment = environments.web || environments.webWorker;
      if (defaultEnvironment.output) {
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
          assetPrefix: true,
          client: {
            host: '127.0.0.1:<port>',
            port: '<port>',
            protocol: 'ws',
          },
        },
      };

      // extraConfig must be at the end, for dev.writeToDisk
      return mergeRsbuildConfig(config, extraConfig);
    });

    api.onBeforeStartDevServer(async ({ environments }) => {
      const webEntry = environments.web?.entry;
      if (!webEntry) return;

      const contentEntryNames = Object.keys(webEntry).filter((item) => item.startsWith('content'));
      if (contentEntryNames.length) {
        const contentFiles = contentEntryNames
          .flatMap((key) => getRsbuildEntryFile(webEntry, key))
          .map((fileName) => resolve(rootPath, fileName));
        const defaultContentFile = resolve(selfRootPath, './assets/default-content.js');
        const defaultContent = await readFile(defaultContentFile, 'utf-8');

        api.transform({ test: (resource) => contentFiles.includes(resource), environments: ['web'] }, ({ code }) => {
          return `${code}\n${defaultContent}`;
        });
      }
    });

    api.onAfterEnvironmentCompile(async (params) => {
      await writeManifestEntries(manifest, {
        ...params,
        originManifest: options.manifest as ManifestV3,
      });
    });

    api.onDevCompileDone(async () => {
      const distPath = api.getNormalizedConfig().output.distPath.root;
      await writeFile(`${distPath}/manifest.json`, JSON.stringify(manifest, null, 2));
      console.log('Built the extension successfully');
    });

    api.onAfterBuild(async () => {
      const distPath = api.getNormalizedConfig().output.distPath.root;
      await writeFile(`${distPath}/manifest.json`, JSON.stringify(manifest));
      console.log('Built the extension successfully');
    });
  },
});

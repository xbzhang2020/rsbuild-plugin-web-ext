import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { ContentConfig, Manifest, BrowserTarget } from './manifest.js';
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
  target?: BrowserTarget;
};

export type ContentScriptConfig = ContentConfig;

export const pluginWebExt = (options: PluginWebExtOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',

  setup: (api) => {
    const rootPath = api.context.rootPath;
    const selfRootPath = __dirname;
    let manifest = {} as Manifest;

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      manifest = await normalizeManifest({
        manifest: options.manifest as Manifest,
        target: options.target || 'chrome-mv3',
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
          client: {
            host: '127.0.0.1:<port>',
            port: '<port>',
            protocol: 'ws',
            reconnect: 20,
          },
        },
      };

      // extraConfig must be at the end, for dev.writeToDisk
      return mergeRsbuildConfig(config, extraConfig);
    });

    api.onBeforeStartDevServer(async () => {
      const config = api.getNormalizedConfig();
      const client = JSON.stringify(config.dev.client);
      const liveReload = JSON.stringify(config.dev.liveReload);
      api.transform({ test: /background-runtime\.js$/, environments: ['webWorker'] }, ({ code }) => {
        return code.replace('RSBUILD_CLIENT_CONFIG', client).replace('RSBUILD_DEV_LIVE_RELOAD', liveReload);
      });
    });

    api.onAfterEnvironmentCompile(async (params) => {
      await writeManifestEntries(manifest, {
        ...params,
        originManifest: options.manifest as Manifest,
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

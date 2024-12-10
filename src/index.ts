import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import { normalizeManifest, writeManifestEntries, writeManifestFile } from './manifest/index.js';
import type { BrowserTarget, Manifest } from './manifest/manifest.js';
import { clearOutdatedHotUpdateFiles, getRsbuildEntryFile, normalizeRsbuildEnviroments } from './rsbuild.js';

export type PluginWebExtOptions = {
  manifest?: unknown;
  srcDir?: string;
  target?: BrowserTarget;
};

export type { ContentScriptConfig } from './manifest/manifest.js';

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

      const environments = normalizeRsbuildEnviroments(manifest, config, selfRootPath);
      const extraConfig: RsbuildConfig = {
        environments,
        dev: {
          writeToDisk: true,
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

    api.onBeforeStartDevServer(async ({ environments }) => {
      const { webContent } = environments;
      if (!webContent) return;
      const contentEntries = Object.keys(webContent.entry)
        .flatMap((key) => getRsbuildEntryFile(webContent.entry, key))
        .filter((item) => !!item)
        .map((item) => resolve(rootPath, item));

      const loadScript = await readFile(resolve(selfRootPath, './assets/load_script.js'), 'utf-8');
      const reloadExtensionCode = await readFile(resolve(selfRootPath, './assets/reload_extension_fn.js'), 'utf-8');
      const liveReload = api.getNormalizedConfig().dev.liveReload;

      api.transform(
        {
          environments: ['webContent'],
          test: /\.(ts|js|tsx|jsx|mjs|cjs)$/,
        },
        ({ code, resourcePath }) => {
          // change the origin load_script in source code
          if (contentEntries.includes(resourcePath)) {
            return `${code}\n${loadScript}`;
          }

          // volatile, the best choice is that rsbuild exposes an API.
          if (resourcePath.endsWith('hmr.js') && liveReload) {
            const reloadCode = 'window.location.reload();';
            return code.replace(reloadCode, `{\n${reloadExtensionCode}\n${reloadCode}\n}`);
          }

          return code;
        },
      );
    });

    api.onAfterEnvironmentCompile(async (params) => {
      await writeManifestEntries(manifest, {
        ...params,
        originManifest: options.manifest as Manifest,
      });
    });

    api.processAssets({ stage: 'optimize' }, ({ assets, compilation }) => {
      const assetName = '_empty.js';
      if (assets[assetName]) {
        compilation.deleteAsset(assetName);
      }
    });

    api.onDevCompileDone(async ({ stats }) => {
      const distPath = api.getNormalizedConfig().output.distPath.root;
      await writeManifestFile(distPath, manifest);

      // clear outdated hmr files
      const statsList = 'stats' in stats ? stats.stats : [stats];
      clearOutdatedHotUpdateFiles(distPath, statsList);
    });

    api.onAfterBuild(async () => {
      const distPath = api.getNormalizedConfig().output.distPath.root;
      await writeManifestFile(distPath, manifest);
    });
  },
});

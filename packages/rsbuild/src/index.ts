import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import { normalizeManifest, writeManifestEntries, writeManifestFile } from './manifest/index.js';
import type { ManifestEntryPoints } from './manifest/manifest.js';
import { clearOutdatedHotUpdateFiles, getRsbuildEntryFile, normalizeRsbuildEnviroments } from './rsbuild/index.js';
import type { Manifest, PluginWebExtOptions } from './types.js';

export type { ContentScriptConfig } from './types.js';

export const pluginWebExt = (options: PluginWebExtOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',
  setup: (api) => {
    const rootPath = api.context.rootPath;
    const selfRootPath = __dirname;
    let manifest = {} as Manifest;

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      manifest = await normalizeManifest(options, rootPath, selfRootPath);

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
        server: {
          printUrls: false,
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

      const loadScript = await readFile(resolve(selfRootPath, './static/load_script.js'), 'utf-8');
      const reloadExtensionCode = await readFile(resolve(selfRootPath, './static/reload_extension_fn.js'), 'utf-8');
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

    api.onAfterEnvironmentCompile(async ({ stats, environment }) => {
      // @see https://rspack.dev/api/javascript-api/stats-json
      const entrypoints = stats?.toJson().entrypoints;
      if (!entrypoints) return;

      const manifestEntryPoints = Object.entries(entrypoints).reduce((res, [entryName, entrypoint]) => {
        const entryPath = getRsbuildEntryFile(environment.entry, entryName);
        const assets =
          entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.')) || [];
        const auxiliaryAssets =
          entrypoint.auxiliaryAssets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.')) || [];

        return Object.assign(res, {
          [entryName]: { assets, auxiliaryAssets, input: entryPath },
        } as ManifestEntryPoints);
      }, {} as ManifestEntryPoints);

      await writeManifestEntries({
        manifest,
        optionManifest: options.manifest as Manifest,
        rootPath,
        entrypoints: manifestEntryPoints,
      });
    });

    api.processAssets({ stage: 'optimize', environments: ['icons'] }, async ({ assets, compilation, sources }) => {
      for (const name in assets) {
        if (name.endsWith('.js')) {
          compilation.deleteAsset(name);
        }
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
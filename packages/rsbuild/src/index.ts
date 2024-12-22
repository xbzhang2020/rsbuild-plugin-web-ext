import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import {
  getExtensionTarget,
  copyPublicFiles,
  getOutputDir,
  normalizeManifest,
  writeManifestEntries,
  writeManifestFile,
  getSrcDir,
} from './manifest/index.js';
import type { ExtensionTarget, ManifestEntryOutput, WebExtensionManifest } from './manifest/types.js';
import { clearOutdatedHotUpdateFiles, getRsbuildEntryImport, normalizeRsbuildEnvironments } from './rsbuild/index.js';
import type { EnviromentKey } from './rsbuild/types.js';

export type PluginWebExtOptions<T = unknown> = {
  manifest?: T;
  target?: ExtensionTarget;
  srcDir?: string;
  outDir?: string;
};

export type { ContentScriptConfig } from './manifest/types.js';

export const pluginWebExt = (options: PluginWebExtOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',
  setup: (api) => {
    const rootPath = api.context.rootPath;
    const selfRootPath = __dirname;
    let manifest = {} as WebExtensionManifest;
    let mode = process.env.NODE_ENV as RsbuildConfig['mode'];
    const target = getExtensionTarget(options.target);

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      if (config.mode) {
        mode = config.mode;
      }

      const { manifest: optionsManifest, srcDir } = options;
      manifest = await normalizeManifest({
        rootPath,
        selfRootPath,
        manifest: optionsManifest as WebExtensionManifest,
        srcDir: getSrcDir(rootPath, srcDir),
        target: getExtensionTarget(options.target),
        mode,
      });

      const environments = await normalizeRsbuildEnvironments({ manifest, config, selfRootPath, rootPath });
      const outDir = options.outDir || getOutputDir(config.output?.distPath?.root, target, mode);
      const extraConfig: RsbuildConfig = {
        environments,
        dev: {
          writeToDisk: true,
          client: {
            host: '127.0.0.1:<port>',
            port: '<port>',
            protocol: 'ws',
          },
        },
        server: {
          printUrls: false,
        },
        output: {
          distPath: {
            root: outDir,
          },
        },
      };

      // extraConfig must be at the end, for dev.writeToDisk
      return mergeRsbuildConfig(config, extraConfig);
    });

    api.onBeforeStartDevServer(async ({ environments }) => {
      const enviromentKey: EnviromentKey = 'content';
      const content = environments[enviromentKey];
      if (!content) return;

      const contentEntries = Object.keys(content.entry)
        .flatMap((key) => getRsbuildEntryImport(content.entry, key))
        .filter((item) => !!item)
        .map((item) => resolve(rootPath, item));

      const contentHmr = await readFile(resolve(selfRootPath, './static/content_hmr.js'), 'utf-8');

      api.transform(
        {
          environments: [enviromentKey],
          test: /\.(ts|js|tsx|jsx|mjs|cjs)$/,
        },
        ({ code, resourcePath }) => {
          // change the origin load_script in source code
          if (contentEntries.includes(resourcePath)) {
            return `${code}\n${contentHmr}`;
          }

          return code;
        },
      );
    });

    api.processAssets({ stage: 'additional' }, async ({ assets, compilation, environment }) => {
      if (environment.name === 'icons') {
        for (const name in assets) {
          if (name.endsWith('.js')) {
            compilation.deleteAsset(name);
          }
        }
      }
    });

    api.onAfterEnvironmentCompile(async ({ stats, environment }) => {
      // @see https://rspack.dev/api/javascript-api/stats-json
      const entrypoints = stats?.toJson().entrypoints;
      if (!entrypoints) return;

      const manifestEntry: ManifestEntryOutput = {};
      for (const [entryName, entrypoint] of Object.entries(entrypoints)) {
        const input = [getRsbuildEntryImport(environment.entry, entryName)].flat();

        const { assets = [], auxiliaryAssets = [] } = entrypoint;
        const output = [...assets, ...auxiliaryAssets]
          .map((item) => item.name)
          .filter((item) => !item.includes('.hot-update.'));

        manifestEntry[entryName] = {
          input,
          output,
        };
      }

      await writeManifestEntries({
        manifest,
        rootPath,
        entry: manifestEntry,
      });
    });

    api.onDevCompileDone(async ({ stats }) => {
      const distPath = api.context.distPath;
      await copyPublicFiles(rootPath, distPath);
      await writeManifestFile({ distPath, manifest, mode });

      // clear outdated hmr files
      const statsList = 'stats' in stats ? stats.stats : [stats];
      clearOutdatedHotUpdateFiles(distPath, statsList);

      console.log('Built the extension successfully');
    });

    api.onAfterBuild(async () => {
      const distPath = api.context.distPath;
      await writeManifestFile({ distPath, manifest, mode });

      console.log('Built the extension successfully');
    });
  },
});

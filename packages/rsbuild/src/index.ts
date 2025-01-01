import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import {
  copyPublicFiles,
  getOutDir,
  getSrcDir,
  getTarget,
  getWatchFiles,
  normalizeManifest,
  setTargetEnv,
  writeManifestEntries,
  writeManifestFile,
} from './manifest/index.js';
import type { ExtensionTarget, ManifestEntryOutput, WebExtensionManifest } from './manifest/types.js';
import {
  clearOutdatedHotUpdateFiles,
  getRsbuildEntryImport,
  isDevMode,
  normalizeRsbuildEnvironments,
} from './rsbuild/index.js';

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

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      if (config.mode) {
        mode = config.mode;
      }

      const target = getTarget(options.target);
      setTargetEnv(target);

      const srcDir = getSrcDir(rootPath, options.srcDir);

      const outDir = getOutDir({
        outdir: options.outDir,
        distPath: config.output?.distPath?.root,
        target,
        mode,
      });

      manifest = await normalizeManifest({
        rootPath,
        selfRootPath,
        manifest: options.manifest as WebExtensionManifest,
        srcDir,
        target,
        mode,
      });

      const environments = await normalizeRsbuildEnvironments({ manifest, config, selfRootPath });
      const isSelfCommand = process.argv[2] === 'rsbuild:dev';
      const extraConfig: RsbuildConfig = {
        environments,
        dev: {
          writeToDisk: true,
          client: {
            host: '127.0.0.1:<port>',
            port: '<port>',
            protocol: 'ws',
          },
          watchFiles: isSelfCommand
            ? [
                {
                  type: 'reload-server',
                  paths: getWatchFiles(),
                  options: {
                    cwd: resolve(rootPath, srcDir),
                    ignoreInitial: false,
                  },
                },
              ]
            : undefined,
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

    api.processAssets({ stage: 'additional' }, async ({ assets, compilation, environment, sources }) => {
      if (environment.name === 'icons') {
        for (const name in assets) {
          if (name.endsWith('.js')) {
            compilation.deleteAsset(name);
          }
        }
        return;
      }

      // support content hmr in dev mode
      if (isDevMode(mode) && environment.name === 'content') {
        const reloadExtensionCode = await readFile(resolve(selfRootPath, './static/content_reload.js'), 'utf-8');
        const entries = Object.keys(environment.entry);
        for (const name in assets) {
          if (!name.endsWith('.js')) continue;
          const entryName = entries.find((item) => name.includes(item));
          if (entryName) {
            const oldContent = assets[name].source() as string;
            const newContent = oldContent.replaceAll(
              'webpackHotUpdateWebExtend_content',
              `webpackHotUpdateWebExtend_${entryName}`,
            );
            const source = new sources.RawSource(newContent);
            compilation.updateAsset(name, source);
          } else {
            const oldContent = assets[name].source() as string;
            const reg = /\b(?:window\.)?location\.reload\(\);?/g;
            const newContent = oldContent.replace(reg, `{\n${reloadExtensionCode}\n$&\n}`);
            const source = new sources.RawSource(newContent);
            compilation.updateAsset(name, source);
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

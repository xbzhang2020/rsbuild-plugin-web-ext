import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import type { BrowserTarget, Manifest } from './manifest.js';
import {
  getRsbuildEntryFile,
  normalizeManifest,
  normalizeRsbuildEnviroments,
  writeManifest,
  writeManifestEntries,
} from './process/index.js';

export type PluginWebExtOptions = {
  manifest?: unknown;
  srcDir?: string;
  target?: BrowserTarget;
};

export type { ContentConfig as ContentScriptConfig } from './manifest.js';

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

      const environments = normalizeRsbuildEnviroments(manifest, config);

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
      const webContentEntry = environments.webContent?.entry || {};
      const contentFiles = Object.keys(webContentEntry)
        .filter((key) => key.startsWith('content'))
        .flatMap((key) => getRsbuildEntryFile(webContentEntry, key))
        .map((file) => resolve(rootPath, file));

      if (!contentFiles.length) return;
      const loadScript = await readFile(resolve(selfRootPath, './runtime/load_script.js'), 'utf-8');
      const reloadExtensionCode = await readFile(resolve(selfRootPath, './runtime/reload_extension_fn.js'), 'utf-8');
      const liveReload = api.getNormalizedConfig().dev.liveReload;

      // only transform in the first compile
      const transformedFiles: string[] = [];
      api.transform(
        { environments: ['web', 'webContent'], test: /\.(ts|js|tsx|jsx|mjs|cjs)/ },
        ({ code, resourcePath }) => {
          if (!transformedFiles.includes(resourcePath)) {
            transformedFiles.push(resourcePath);

            if (contentFiles.includes(resourcePath)) {
              return `${code}\n${loadScript}`;
            }

            // volatile, the best choice is that rsbuild exposes an API.
            if (resourcePath.endsWith('hmr.js') && liveReload) {
              const reloadCode = 'window.location.reload();';
              return code.replace(reloadCode, `{\n${reloadExtensionCode}\n${reloadCode}\n}`);
            }
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

    api.onDevCompileDone(async () => {
      const distPath = api.getNormalizedConfig().output.distPath.root;
      await writeManifest(distPath, manifest);
    });

    api.onAfterBuild(async () => {
      const distPath = api.getNormalizedConfig().output.distPath.root;
      await writeManifest(distPath, manifest);
    });
  },
});

import { cp, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';

export type pluginWebExtOptions = {
  manifest?: chrome.runtime.ManifestV3;
};

export const pluginWebExt = (
  options: pluginWebExtOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:plugin-web-ext',

  setup: (api) => {
    const myMainfest = { ...(options.manifest || {}) };

    const env = process.env.NODE_ENV;
    const entryMap: Record<string, string | string[]> = {};

    api.modifyRsbuildConfig((config) => {
      config.source = {
        entry: {},
        ...(config.source || {}),
      };

      // entries
      if (config.source.entry) {
        // background
        const service_worker = myMainfest.background?.service_worker;
        if (service_worker) {
          entryMap.background = service_worker;
        }

        // popup
        const popup = myMainfest.action?.default_popup;
        if (popup) {
          entryMap.popup = popup;
        }

        // contents
        const contentScripts = myMainfest.content_scripts;
        if (contentScripts) {
          contentScripts.forEach((contentScript, index) => {
            if (contentScript.js?.length) {
              const name = `content${index === 0 ? '' : index}`;
              entryMap[name] = contentScript.js;
            }
          });
        }

        for (const [key, value] of Object.entries(entryMap)) {
          config.source.entry[key] = {
            import: value,
            html: key === 'popup',
          };
        }
      }

      // dev
      if (!config.dev?.writeToDisk) {
        config.dev = {
          ...(config.dev || {}),
          writeToDisk: true,
        };
      }
    });

    api.onAfterEnvironmentCompile(async ({ stats, environment }) => {
      if (env === 'development') {
        myMainfest.version_name = 'development';
      }

      // refer to https://rspack.dev/api/javascript-api/stats-json
      const entrypoints = stats?.toJson().entrypoints;
      if (!entrypoints) return;

      // entries
      for (const [key, entrypoint] of Object.entries(entrypoints)) {
        const assets = entrypoint.assets?.map((item) => item.name);

        if (key === 'background' && assets) {
          myMainfest.background = {
            service_worker: assets[0],
          };
        }

        if (key === 'popup' && myMainfest.action) {
          myMainfest.action.default_popup = `${entrypoint.name}.html`;
        }

        if (key.startsWith('content') && myMainfest.content_scripts && assets) {
          const index = Number(key.replace('content', '') || '0');
          myMainfest.content_scripts[index].js = assets.filter(
            (item) => item.endsWith('.js') && !item.includes('.hot-update.'),
          );
          myMainfest.content_scripts[index].css = assets.filter((item) =>
            item.endsWith('.css'),
          );
        }
      }

      const outDir = environment.distPath;

      // icons
      const icons = [
        ...Object.values(myMainfest.icons || {}),
        ...Object.values(myMainfest.action?.default_icon || {}),
      ];
      for await (const icon of icons) {
        await cp(icon, resolve(outDir, icon));
      }

      // manifest.json
      await writeFile(`${outDir}/manifest.json`, JSON.stringify(myMainfest));

      console.log('Built the extension successfully');
    });
  },
});

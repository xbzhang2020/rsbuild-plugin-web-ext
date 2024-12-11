import { existsSync } from 'node:fs';
import { readdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { EnvironmentConfig, RsbuildConfig, RsbuildEntry, Rspack } from '@rsbuild/core';
import { copyIcons, readManifestEntries } from './manifest/index.js';
import type { Manifest } from './manifest/manifest.js';

export function getRsbuildEntryFile(entries: RsbuildEntry, key: string) {
  const entry = entries[key];
  if (typeof entry === 'string' || Array.isArray(entry)) {
    return entry;
  }
  return entry.import;
}

export type EnviromentKey = 'web' | 'webContent' | 'webWorker';

export function normalizeRsbuildEnviroments(manifest: Manifest, config: RsbuildConfig, selfRootPath: string) {
  const { background, content, ...others } = readManifestEntries(manifest);

  const environments: {
    [key in EnviromentKey]?: EnvironmentConfig;
  } = {};

  if (background) {
    environments.webWorker = {
      source: {
        entry: background,
      },
      output: {
        target: 'web-worker',
      },
    };
  }

  if (content) {
    environments.webContent = {
      source: {
        entry: content,
      },
      output: {
        target: 'web',
        injectStyles: process.env.NODE_ENV === 'development',
      },
      dev: {
        assetPrefix: true,
      },
    };
  }

  const webEntry = Object.values(others).filter((entry) => !!entry);
  if (webEntry.length) {
    const entry = webEntry.reduce((res, cur) => {
      for (const key in cur) {
        res[key] = cur[key];
      }
      return res;
    }, {});
    environments.web = {
      source: {
        entry,
      },
      output: {
        target: 'web',
      },
    };
  }

  let defaultEnvironment = environments.web || environments.webContent || environments.webWorker;
  if (!defaultEnvironment) {
    defaultEnvironment = environments.web = {
      source: {
        entry: {
          _empty: {
            import: resolve(selfRootPath, './assets/empty_entry.js'),
            html: false,
          },
        },
      },
      output: {
        target: 'web',
        distPath: {
          js: '',
        },
        filename: {
          js: '[name].js',
        },
      },
    };
  }

  if (defaultEnvironment?.output) {
    const imagePath = config.output?.distPath?.image || 'static/image';
    defaultEnvironment.output.copy = [...copyIcons(manifest, imagePath)];
  }

  return environments;
}

function getHotUpdateAssets(statsList: Rspack.Stats[]) {
  const entrypointsList = statsList.map((item) => item?.toJson().entrypoints).filter((item) => !!item);
  const res: string[] = [];

  for (const entrypoints of entrypointsList) {
    const data = Object.values(entrypoints).flatMap((entrypoint) => {
      const assets = entrypoint.assets?.map((item) => item.name).filter((item) => item.includes('.hot-update.'));
      return assets || [];
    });
    res.push(...data);
  }
  return res;
}

export async function clearOutdatedHotUpdateFiles(distPath: string, statsList: Rspack.Stats[]) {
  if (!existsSync(distPath)) return;
  const reservedFiles = getHotUpdateAssets(statsList);

  const files = await readdir(distPath, {
    withFileTypes: true,
  });
  const outdatedFiles: string[] = [];

  for (const file of files) {
    const { name } = file;
    if (file.isFile() && name.includes('.hot-update.')) {
      const item = reservedFiles.find((prefix) => name.includes(prefix));
      if (!item) {
        outdatedFiles.push(file.name);
      }
    }
  }

  for (const file of outdatedFiles) {
    await unlink(resolve(distPath, file));
  }
}

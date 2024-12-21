import { existsSync } from 'node:fs';
import { readdir, unlink } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import type {
  EnvironmentConfig,
  EnvironmentContext,
  OutputConfig,
  RsbuildConfig,
  RsbuildEntry,
  Rspack,
} from '@rsbuild/core';
import { readManifestEntries, writeManifestEntries } from '../manifest/index.js';
import type { ManifestEntryOutput, WebExtensionManifest } from '../manifest/types.js';
import type { EnviromentKey } from './types.js';

function isDevMode(mode: string | undefined) {
  return mode === 'development';
}

export function getRsbuildEntryFile(entries: RsbuildEntry, key: string) {
  const entry = entries[key];
  if (typeof entry === 'string' || Array.isArray(entry)) {
    return entry;
  }
  return entry.import;
}

function getContentRuntimeOutputPath(from: string, config: RsbuildConfig) {
  return join(config.output?.distPath?.js || 'static/js', basename(from));
}

interface NormalizeEnvironmentProps {
  manifest: WebExtensionManifest;
  config: RsbuildConfig;
  selfRootPath: string;
  rootPath: string;
}

export async function normalizeRsbuildEnvironments({
  manifest,
  config,
  selfRootPath,
  rootPath,
}: NormalizeEnvironmentProps) {
  const { icons, background, content, ...others } = readManifestEntries(manifest);
  const mode = config.mode || process.env.NODE_ENV;

  const environments: {
    [key in EnviromentKey]?: EnvironmentConfig;
  } = {};
  let defaultEnvironment: EnvironmentConfig | null = null;

  if (icons) {
    defaultEnvironment = environments.icons = {
      source: {
        entry: icons as RsbuildEntry,
      },
      output: {
        target: 'web',
        dataUriLimit: 0,
        filenameHash: false,
      },
    };
  }

  if (background) {
    defaultEnvironment = environments.background = {
      source: {
        entry: background,
      },
      output: {
        target: 'web-worker',
      },
    };
  }

  if (content) {
    const { content_runtime, ...normalContent } = content;
    const copy: OutputConfig['copy'] = [];
    if (content_runtime) {
      const from = [content_runtime.import].flat()[0];
      const to = getContentRuntimeOutputPath(from, config);
      copy.push({ from, to });
      await writeManifestEntries({
        manifest,
        rootPath,
        entry: {
          content_runtime: {
            import: content_runtime.import,
            assets: [to],
          },
        },
      });
    }

    defaultEnvironment = environments.content = {
      source: {
        entry: normalContent as RsbuildEntry,
      },
      output: {
        target: 'web',
        // support hmr
        injectStyles: isDevMode(mode),
        copy,
      },
      dev: {
        // support hmr
        assetPrefix: true,
      },
    };
  }

  const webEntry = Object.values(others)
    .filter((entry) => !!entry)
    .reduce((res, cur) => Object.assign(res, cur), {});
  if (Object.values(webEntry).length) {
    defaultEnvironment = environments.web = {
      source: {
        entry: webEntry as RsbuildEntry,
      },
      output: {
        target: 'web',
      },
    };
  }

  if (!defaultEnvironment) {
    // void the empty entry error
    defaultEnvironment = environments.icons = {
      source: {
        entry: {
          empty: {
            import: resolve(selfRootPath, './static/empty_entry.js'),
            html: false,
          },
        },
      },
      output: {
        target: 'web',
      },
    };
  }

  return environments;
}

export function getManifestEntryOutput({
  stats,
  environment,
}: {
  stats: Rspack.Stats | undefined;
  environment: EnvironmentContext;
}): ManifestEntryOutput | undefined {
  // @see https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return;

  const manifestEntry: ManifestEntryOutput = {};
  for (const [entryName, entrypoint] of Object.entries(entrypoints)) {
    const { assets = [], auxiliaryAssets = [] } = entrypoint;
    const entryAssets = [...assets, ...auxiliaryAssets]
      .map((item) => item.name)
      .filter((item) => !item.includes('.hot-update.'));

    const entryImport = getRsbuildEntryFile(environment.entry, entryName);
    manifestEntry[entryName] = {
      import: entryImport,
      assets: entryAssets,
    };
  }

  return manifestEntry;
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

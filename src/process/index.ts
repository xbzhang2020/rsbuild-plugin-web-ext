import { existsSync } from 'node:fs';
import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { EnvironmentConfig, EnvironmentContext, RsbuildConfig, RsbuildEntry, Rspack } from '@rsbuild/core';
import type { BrowserTarget, Manifest, ManifestV3 } from '../manifest.js';
import { getBackgroundEntry, mergeBackgroundEntry, writeBackgroundEntry } from './background.js';
import { getContentsEntry, mergeContentsEntry, writeContentsEntry } from './content.js';
import { getDevtoolsEntry, mergeDevtoolsEntry, writeDevtoolsEntry } from './devtools.js';
import { copyIcons, mergeIconsEntry } from './icons.js';
import { copyLocales } from './locales.js';
import { getOptionsEntry, mergeOptionsEntry, writeOptionsEntry } from './options.js';
import { getPopupEntry, mergePopupEntry, writePopupEntry } from './popup.js';
import type { NormalizeManifestProps, WriteMainfestEntryProps } from './process.js';
import { copyWebAccessibleResources } from './resources.js';
import { getSandboxEntry, mergeSandboxEntry, writeSandboxEntry } from './sandbox.js';

type EntryProcessor = {
  match: (key: string) => boolean;
  merge: (props: NormalizeManifestProps & { entryPath: string | string[] }) => void;
  write: (props: WriteMainfestEntryProps) => void | Promise<void>;
};

const entryProcessors: EntryProcessor[] = [
  { match: (key) => key === 'background', merge: mergeBackgroundEntry, write: writeBackgroundEntry },
  { match: (key) => key.startsWith('content'), merge: mergeContentsEntry, write: writeContentsEntry },
  { match: (key) => key === 'popup', merge: mergePopupEntry, write: writePopupEntry },
  { match: (key) => key === 'options', merge: mergeOptionsEntry, write: writeOptionsEntry },
  { match: (key) => key === 'devtools', merge: mergeDevtoolsEntry, write: writeDevtoolsEntry },
  { match: (key) => key.startsWith('sandbox'), merge: mergeSandboxEntry, write: writeSandboxEntry },
];

async function readPackageJson(rootPath: string) {
  try {
    const filePath = resolve(rootPath, './package.json');
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.warn('Failed to read package.json:', err instanceof Error ? err.message : err);
    return {};
  }
}

function getFileName(file: string) {
  return file.split('.')[0];
}

function isEntryFile(file: string) {
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(file);
}

export function getRsbuildEntryFile(entries: RsbuildEntry, key: string) {
  const entry = entries[key];
  if (typeof entry === 'string' || Array.isArray(entry)) {
    return entry;
  }
  return entry.import;
}

export async function normalizeManifest(props: NormalizeManifestProps) {
  const { manifest, rootPath, target } = props;
  let finalManifest = {} as ManifestV3;
  const defaultManifest = (await getDefaultManifest(rootPath, target)) as ManifestV3;

  finalManifest = {
    ...defaultManifest,
    ...((manifest || {}) as ManifestV3),
  };

  if (process.env.NODE_ENV === 'development') {
    finalManifest.version_name ??= `${finalManifest.version} (development)`;
    finalManifest.permissions ??= [];
    finalManifest.host_permissions ??= [];

    if (!finalManifest.permissions.includes('scripting')) {
      finalManifest.permissions.push('scripting');
    }

    if (!finalManifest.host_permissions.includes('*://*/*')) {
      finalManifest.host_permissions.push('*://*/*');
    }
  }

  await mergeManifestEntries({
    ...props,
    manifest: finalManifest,
  });
  return finalManifest;
}

export async function getDefaultManifest(rootPath: string, target: BrowserTarget) {
  const manifest: Manifest = {
    manifest_version: target.includes('2') ? 2 : 3,
    name: '',
    version: '',
  };

  const pkg = await readPackageJson(rootPath);
  const { name, displayName, version, description, author, homepage } = pkg;
  return {
    ...manifest,
    ...(name && { name: displayName || name }),
    ...(version && { version }),
    ...(description && { description }),
    ...(author && { author }),
    ...(homepage && { homepage_url: homepage }),
  };
}

export async function mergeManifestEntries(props: NormalizeManifestProps) {
  const { srcPath } = props;

  try {
    const files = await readdir(srcPath, {
      withFileTypes: true,
    });
    let backgroundFile: string | undefined = undefined;
    const contentFiles: string[] = [];
    const sandboxFiles: string[] = [];

    for (const file of files) {
      const { name } = file;
      const filePath = `./${name}`;

      if (file.isDirectory() && ['assets', 'contents', 'sandboxes'].includes(name)) {
        const directoryPath = resolve(srcPath, filePath);
        const subFiles = await readdir(directoryPath, { recursive: true });

        if (name === 'assets') {
          const subFilePaths = subFiles.map((item) => `${filePath}/${item}`);
          mergeIconsEntry({ ...props, entryPath: subFilePaths });
        }

        if (name === 'contents') {
          const subFilePaths = subFiles.filter((item) => isEntryFile(item)).map((item) => `${filePath}/${item}`);
          contentFiles.push(...subFilePaths);
        }
        if (name === 'sandboxes') {
          const subFilePaths = subFiles.filter((item) => isEntryFile(item)).map((item) => `${filePath}/${item}`);
          sandboxFiles.push(...subFilePaths);
        }
        continue;
      }

      if (isEntryFile(name)) {
        switch (getFileName(name)) {
          case 'content': {
            contentFiles.unshift(filePath);
            break;
          }
          case 'background': {
            backgroundFile = filePath;
            break;
          }
          case 'popup': {
            mergePopupEntry({
              ...props,
              entryPath: filePath,
            });
            break;
          }
          case 'options': {
            mergeOptionsEntry({
              ...props,
              entryPath: filePath,
            });
            break;
          }
          case 'devtools': {
            mergeDevtoolsEntry({
              ...props,
              entryPath: filePath,
            });
            break;
          }
          case 'sandbox': {
            sandboxFiles.unshift(filePath);
            break;
          }
        }
      }
    }

    mergeBackgroundEntry({
      ...props,
      entryPath: backgroundFile,
    });

    mergeContentsEntry({
      ...props,
      entryPath: contentFiles,
    });

    if (sandboxFiles.length) {
      mergeSandboxEntry({
        ...props,
        entryPath: sandboxFiles,
      });
    }
  } catch (err) {
    console.error(err);
  }
}

interface WriteManifestOptions {
  stats?: Rspack.Stats;
  environment: EnvironmentContext;
  originManifest?: Manifest;
}

export async function writeManifestEntries(
  manifest: Manifest,
  { stats, environment, originManifest }: WriteManifestOptions,
) {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return manifest;

  for (const [key, entrypoint] of Object.entries(entrypoints)) {
    const assets = entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.'));
    if (!assets) continue;

    const processor = entryProcessors.find((item) => item.match(key));
    if (processor) {
      const props: WriteMainfestEntryProps = {
        key,
        assets,
        manifest,
        originManifest,
        rootPath: environment.config.root,
        entryPath: getRsbuildEntryFile(environment.entry, key),
      };
      await processor.write(props);
    } else {
      console.warn(`No processor found for entry: ${key}`);
    }
  }
}

export async function writeManifestFile(distPath: string, manifest: Manifest) {
  if (!existsSync(distPath)) return;
  const data = process.env.NODE_ENV === 'development' ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
  await writeFile(`${distPath}/manifest.json`, data);
  console.log('Built the extension successfully');
}

export type EnviromentKey = 'web' | 'webContent' | 'webWorker';

export function normalizeRsbuildEnviroments(manifest: Manifest, config: RsbuildConfig) {
  const background = getBackgroundEntry(manifest);
  const content = getContentsEntry(manifest);
  const others = {
    popup: getPopupEntry(manifest),
    options: getOptionsEntry(manifest),
    devtools: getDevtoolsEntry(manifest),
    sandbox: getSandboxEntry(manifest),
  };

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

  const defaultEnvironment = environments.web || environments.webContent || environments.webWorker;
  if (defaultEnvironment?.output) {
    const imagePath = config.output?.distPath?.image || 'static/image';
    defaultEnvironment.output.copy = [
      ...copyIcons(manifest, imagePath),
      ...copyWebAccessibleResources(manifest),
      ...copyLocales(manifest),
    ];
  }

  return environments;
}

export function getHotUpdateAssets(statsList: Rspack.Stats[]) {
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

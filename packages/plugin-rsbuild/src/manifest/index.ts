import { existsSync } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { EnvironmentContext, Rspack, RsbuildEntry } from '@rsbuild/core';
import { getRsbuildEntryFile } from '../rsbuild/index.js';
import type { BrowserTarget, Manifest, PluginWebExtOptions } from '../types.js';
import { getFileBaseName, isJsFile, readPackageJson } from '../util.js';
import { getBackgroundEntry, mergeBackgroundEntry, writeBackgroundEntry } from './background.js';
import { getContentEntry, mergeContentEntry, writeContentEntry } from './content.js';
import { getDevtoolsEntry, mergeDevtoolsEntry, writeDevtoolsEntry } from './devtools.js';
import { mergeIconsEntry } from './icons.js';
import type { ManifestEntryProcessor, NormalizeManifestProps, WriteMainfestEntryProps } from './manifest.js';
import { getOptionsEntry, mergeOptionsEntry, writeOptionsEntry } from './options.js';
import { getPopupEntry, mergePopupEntry, writePopupEntry } from './popup.js';
import { getSandboxEntry, mergeSandboxEntry, writeSandboxEntry } from './sandbox.js';

export { copyIcons } from './icons.js';

const entryProcessors: ManifestEntryProcessor[] = [
  {
    key: 'background',
    match: (entryName) => entryName === 'background',
    merge: mergeBackgroundEntry,
    get: getBackgroundEntry,
    write: writeBackgroundEntry,
  },
  {
    key: 'content',
    match: (entryName) => entryName.startsWith('content'),
    merge: mergeContentEntry,
    get: getContentEntry,
    write: writeContentEntry,
  },
  {
    key: 'popup',
    match: (entryName) => entryName === 'popup',
    merge: mergePopupEntry,
    get: getPopupEntry,
    write: writePopupEntry,
  },
  {
    key: 'options',
    match: (entryName) => entryName === 'options',
    merge: mergeOptionsEntry,
    get: getOptionsEntry,
    write: writeOptionsEntry,
  },
  {
    key: 'devtools',
    match: (entryName) => entryName === 'devtools',
    merge: mergeDevtoolsEntry,
    get: getDevtoolsEntry,
    write: writeDevtoolsEntry,
  },
  {
    key: 'sandbox',
    match: (entryName) => entryName.startsWith('sandbox'),
    merge: mergeSandboxEntry,
    get: getSandboxEntry,
    write: writeSandboxEntry,
  },
];

export async function normalizeManifest(options: PluginWebExtOptions, rootPath: string, selfRootPath: string) {
  const { manifest = {}, target = 'chrome-mv3', srcDir = '.' } = options || {};

  const defaultManifest = await getDefaultManifest(rootPath, target);
  const finalManifest = {
    ...defaultManifest,
    ...(manifest as Manifest),
  } as Manifest;

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
    manifest: finalManifest,
    target,
    srcPath: resolve(rootPath, srcDir),
    rootPath,
    selfRootPath,
  });
  return finalManifest;
}

async function getDefaultManifest(rootPath: string, target?: BrowserTarget) {
  const manifest: Manifest = {
    manifest_version: target?.includes('2') ? 2 : 3,
    name: '',
    version: '',
  };

  const pkg = await readPackageJson(rootPath);
  const { name, displayName, version, description, author, homepage } = pkg;
  const trimVersion = version.match(/[\d\.]+/)?.[0];

  return {
    ...manifest,
    ...(name && { name: displayName || name }),
    ...(trimVersion && { version: trimVersion }),
    ...(description && { description }),
    ...(author && { author }),
    ...(homepage && { homepage_url: homepage }),
  } as Manifest;
}

async function mergeManifestEntries(props: NormalizeManifestProps) {
  const { srcPath } = props;

  try {
    const entries = entryProcessors.reduce(
      (res, cur) => {
        res[cur.key] = [];
        return res;
      },
      {} as Record<ManifestEntryProcessor['key'], string[]>,
    );

    const files = await readdir(srcPath, {
      withFileTypes: true,
    });

    for (const file of files) {
      const filePath = `./${file.name}`;

      if (file.name === 'assets' && file.isDirectory()) {
        const directoryPath = resolve(srcPath, filePath);
        const subFiles = await readdir(directoryPath, { recursive: true });
        const subFilePaths = subFiles.map((item) => `${filePath}/${item}`);
        mergeIconsEntry({ ...props, entryPath: subFilePaths });
        continue;
      }

      const processor = entryProcessors.find((item) => item.match(getFileBaseName(file.name)));
      if (!processor) continue;

      if (isJsFile(file.name)) {
        entries[processor.key].push(filePath);
        continue;
      }

      if (file.isDirectory()) {
        const directoryPath = resolve(srcPath, filePath);
        const subFiles = await readdir(directoryPath, { recursive: true });
        const subFilePaths = subFiles.map((item) => `${filePath}/${item}`).filter((item) => isJsFile(item));
        entries[processor.key].push(...subFilePaths);
      }
    }

    for (const [key, entryPath] of Object.entries(entries)) {
      const processor = entryProcessors.find((item) => item.key === key);
      processor?.merge({ ...props, entryPath });
    }
  } catch (err) {
    console.error(err);
  }
}

export function readManifestEntries(manifest: Manifest) {
  return entryProcessors.reduce(
    (res, processor) => {
      res[processor.key] = processor.get(manifest);
      return res;
    },
    {} as Record<ManifestEntryProcessor['key'], RsbuildEntry | null>,
  );
}

interface WriteManifestOptions {
  stats?: Rspack.Stats;
  environment: EnvironmentContext;
  optionManifest?: Manifest;
}

export async function writeManifestEntries(
  manifest: Manifest,
  { stats, environment, optionManifest }: WriteManifestOptions,
) {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return manifest;

  for (const [entryName, entrypoint] of Object.entries(entrypoints)) {
    const processor = entryProcessors.find((item) => item.match(entryName));
    if (!processor) continue;

    const assets = entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.'));
    if (!assets) continue;

    const props: WriteMainfestEntryProps = {
      entryName,
      assets,
      manifest,
      optionManifest,
      rootPath: environment.config.root,
      entryPath: getRsbuildEntryFile(environment.entry, entryName),
    };
    await processor.write(props);
  }
}

export async function writeManifestFile(distPath: string, manifest: Manifest) {
  if (!existsSync(distPath)) return;
  const data = process.env.NODE_ENV === 'development' ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
  await writeFile(`${distPath}/manifest.json`, data);
  console.log('Built the extension successfully');
}

import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { EnvironmentContext, RsbuildEntry, Rspack } from '@rsbuild/core';
import type { ManifestV3 } from '../manifest.js';
import { getBackgroundEntry, mergeBackgroundEntry, writeBackgroundEntry } from './background.js';
import { getContentsEntry, mergeContentsEntry, writeContentsEntry } from './content.js';
import { getDevtoolsEntry, mergeDevtoolsEntry, writeDevtoolsEntry } from './devtools.js';
import { mergeIconsEntry } from './icons.js';
import { getOptionsEntry, mergeOptionsEntry, writeOptionsEntry } from './options.js';
import { getPopupEntry, mergePopupEntry, writePopupEntry } from './popup.js';
import type { NormalizeManifestProps } from './process.js';
import { getSandboxEntry, mergeSandboxEntry, writeSandboxEntry } from './sandbox.js';

export { copyIcons } from './icons.js';
export { copyWebAccessibleResources } from './resources.js';
export { copyLocales } from './locales.js';

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
  const { manifest, rootPath } = props;
  let finalManifest = {} as ManifestV3;
  const defaultManifest = await getDefaultManifest(rootPath);

  finalManifest = {
    ...defaultManifest,
    ...(manifest || ({} as ManifestV3)),
  };

  await mergeManifestEntries({
    ...props,
    manifest: finalManifest,
  });
  return finalManifest;
}

export async function getDefaultManifest(srcPath: string) {
  const res = {
    manifest_version: 3,
  } as ManifestV3;

  try {
    const filePath = resolve(srcPath, './package.json');
    const content = await readFile(filePath, 'utf-8');
    const { name, displayName, version, description, author, homepage } = JSON.parse(content);
    res.name = displayName || name;
    res.version = version;
    res.description = description;
    res.author = author;
    res.homepage_url = homepage;
  } catch (e) {
    console.log(e);
  }

  return res;
}

export async function mergeManifestEntries(props: NormalizeManifestProps) {
  const { manifest, srcPath } = props;

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
          mergeIconsEntry(manifest, srcPath, subFilePaths);
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

export function readManifestEntries(manifest: ManifestV3): RsbuildEntry {
  return {
    ...getBackgroundEntry(manifest),
    ...getContentsEntry(manifest),
    ...getPopupEntry(manifest),
    ...getOptionsEntry(manifest),
    ...getDevtoolsEntry(manifest),
    ...getSandboxEntry(manifest),
  };
}

interface WriteManifestOptions {
  stats?: Rspack.Stats;
  environment: EnvironmentContext;
  originManifest?: ManifestV3;
}

export async function writeManifestEntries(
  manifest: ManifestV3,
  { stats, environment, originManifest }: WriteManifestOptions,
) {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return manifest;

  for (const [key, entrypoint] of Object.entries(entrypoints)) {
    const assets = entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.'));
    if (!assets) continue;

    if (key === 'background') {
      writeBackgroundEntry(manifest, key, assets);
    } else if (key.startsWith('content')) {
      await writeContentsEntry(manifest, key, assets, {
        originManifest,
        rootPath: environment.config.root,
        entry: getRsbuildEntryFile(environment.entry, key),
      });
    } else if (key === 'popup') {
      writePopupEntry(manifest, key);
    } else if (key === 'options') {
      writeOptionsEntry(manifest, key);
      return;
    } else if (key === 'devtools') {
      writeDevtoolsEntry(manifest, key);
      return;
    } else if (key.startsWith('sandbox')) {
      writeSandboxEntry(manifest, key);
    }
  }
}

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

function getEntryFile(entries: RsbuildEntry, key: string) {
  const entry = entries[key];
  let srcPath = '';
  if (typeof entry === 'string') {
    srcPath = entry;
  } else if (Array.isArray(entry)) {
    srcPath = entry[0];
  } else if (typeof entry === 'object') {
    srcPath = Array.isArray(entry.import) ? entry.import[0] : entry.import;
  }
  return srcPath;
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

export async function mergeManifestEntries(srcPath: string, manifest: ManifestV3) {
  try {
    const files = await readdir(srcPath, {
      withFileTypes: true,
    });
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
            mergeBackgroundEntry(manifest, srcPath, filePath);
            break;
          }
          case 'popup': {
            mergePopupEntry(manifest, srcPath, filePath);
            break;
          }
          case 'options': {
            mergeOptionsEntry(manifest, srcPath, filePath);
            break;
          }
          case 'devtools': {
            mergeDevtoolsEntry(manifest, srcPath, filePath);
            break;
          }
          case 'sandbox': {
            sandboxFiles.unshift(filePath);
            break;
          }
        }
      }
    }

    if (contentFiles.length) {
      mergeContentsEntry(manifest, srcPath, contentFiles);
    }

    if (sandboxFiles.length) {
      mergeSandboxEntry(manifest, srcPath, sandboxFiles);
    }
  } catch (err) {
    console.error(err);
  }
}

export function readManifestEntries(manifest: ManifestV3): RsbuildEntry {
  return {
    ...getContentsEntry(manifest),
    ...getBackgroundEntry(manifest),
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
      const rootPath = environment.config.root;
      const srcPath = getEntryFile(environment.entry, key);
      await writeContentsEntry(manifest, key, assets, { originManifest, rootPath, srcPath });
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

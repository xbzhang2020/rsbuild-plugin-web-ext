import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getBackgroundEntry, mergeBackgroundEntry, writeBackgroundEntry } from './background.js';
import { getContentsEntry, mergeContentsEntry, writeContentsEntry } from './content.js';
import { getDevtoolsEntry, mergeDevtoolsEntry, writeDevtoolsEntry } from './devtools.js';
import { getOptionsEntry, mergeOptionsEntry, writeOptionsEntry } from './options.js';
import { getPopupEntry, mergePopupEntry, writePopupEntry } from './popup.js';
import { getSandboxEntry, mergeSandboxEntry, writeSandboxEntry } from './sandbox.js';
import type { RsbuildEntry, Rspack } from '@rsbuild/core';
import type { ManifestV3 } from '../manifest.js';

export { copyIcons } from './icons.js';
export { copyWebAccessibleResources } from './resources.js';
export { copyLocales } from './locales.js';

function getFileName(file: string) {
  return file.split('.')[0];
}

function isEntryFile(file: string) {
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(file);
}

export async function mergeManifestEntries(rootPath: string, manifest: ManifestV3) {
  try {
    const files = await readdir(rootPath, {
      withFileTypes: true,
    });
    const contentFiles: string[] = [];
    const sandboxFiles: string[] = [];

    for (const file of files) {
      const { name } = file;
      const filePath = `./${name}`;

      if (file.isDirectory() && ['contents', 'sandboxes'].includes(name)) {
        const directoryPath = resolve(rootPath, filePath);
        const subFiles = await readdir(directoryPath, { recursive: true });
        const subFilePaths = subFiles.filter((item) => isEntryFile(item)).map((item) => `${filePath}/${item}`);

        if (name === 'contents') {
          contentFiles.push(...subFilePaths);
        }
        if (name === 'sandboxes') {
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
            mergeBackgroundEntry(manifest, rootPath, filePath);
            break;
          }
          case 'popup': {
            mergePopupEntry(manifest, rootPath, filePath);
            break;
          }
          case 'options': {
            mergeOptionsEntry(manifest, rootPath, filePath);
            break;
          }
          case 'devtools': {
            mergeDevtoolsEntry(manifest, rootPath, filePath);
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
      await mergeContentsEntry(manifest, rootPath, contentFiles);
    }

    if (sandboxFiles.length) {
      mergeSandboxEntry(manifest, rootPath, sandboxFiles);
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

export function writeManifestEntries(manifest: ManifestV3, stats?: Rspack.Stats) {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return manifest;

  Object.entries(entrypoints).forEach(([key, entrypoint]) => {
    const assets = entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.'));
    if (!assets) return;

    if (key === 'background') {
      writeBackgroundEntry(manifest, key, assets);
      return;
    }

    if (key.startsWith('content')) {
      writeContentsEntry(manifest, key, assets);
      return;
    }

    if (key === 'popup') {
      writePopupEntry(manifest, key);
      return;
    }

    if (key === 'options') {
      writeOptionsEntry(manifest, key);
      return;
    }

    if (key === 'devtools') {
      writeDevtoolsEntry(manifest, key);
      return;
    }

    if (key.startsWith('sandbox')) {
      writeSandboxEntry(manifest, key);
    }
  });
}

import { readdir } from 'node:fs/promises';
import type { RsbuildEntry, Rspack } from '@rsbuild/core';
import type { ManifestV3 } from '../manifest.js';
import { getBackgroundEntry, mergeBackgroundEntry, writeBackgroundEntry } from './background.js';
import { getContentsEntry, mergeContentsEntry, writeContentsEntry } from './content.js';
import { getDevtoolsEntry, mergeDevtoolsEntry, writeDevtoolsEntry } from './devtools.js';
import { getOptionsEntry, mergeOptionsEntry, writeOptionsEntry } from './options.js';
import { getPopupEntry, mergePopupEntry, writePopupEntry } from './popup.js';
import { getSandboxEntry, mergeSandboxEntry, writeSandboxEntry } from './sandbox.js';

export { copyIcons } from './icons.js';
export { copyWebAccessibleResources } from './resources.js';
export { copyLocales } from './locales.js';

function getFileName(file: string) {
  return file.split('.')[0];
}

function isJavaScriptFile(file: string) {
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(file);
}

export async function mergeManifestEntries(rootPath: string, manifest: ManifestV3) {
  try {
    const files = await readdir(rootPath);
    for (const file of files) {
      if (isJavaScriptFile(file)) {
        const filePath = `./${file}`;
        switch (getFileName(file)) {
          case 'content': {
            await mergeContentsEntry(manifest, rootPath, filePath);
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
            mergeSandboxEntry(manifest, rootPath, filePath);
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export function readManifestEntries(manifest: ManifestV3): RsbuildEntry {
  const entryMap: RsbuildEntry = {
    ...getContentsEntry(manifest),
    ...getBackgroundEntry(manifest),
    ...getPopupEntry(manifest),
    ...getOptionsEntry(manifest),
    ...getDevtoolsEntry(manifest),
    ...getSandboxEntry(manifest),
  };

  return entryMap;
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

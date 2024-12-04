import type { ManifestV3 } from '../manifest.js';
import type { RsbuildEntry } from '@rsbuild/core';

export function mergeDevtoolsEntry(manifest: ManifestV3, rootPath: string, filePath: string) {
  if (manifest.devtools_page) return;
  manifest.devtools_page = filePath;
}

export function getDevtoolsEntry(manifest: ManifestV3) {
  const entry: RsbuildEntry = {};

  const devtools = manifest.devtools_page;
  if (devtools) {
    entry.devtools = {
      import: devtools,
      html: true,
    };
  }

  return entry;
}

export function writeDevtoolsEntry(manifest: ManifestV3, key: string) {
  manifest.devtools_page = `${key}.html`;
}

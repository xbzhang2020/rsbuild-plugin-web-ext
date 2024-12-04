import type { RsbuildEntry } from '@rsbuild/core';
import type { ManifestV3 } from '../manifest.js';
import type { NormailzeMainfestEntryProps } from './process.js';

export function mergeDevtoolsEntry({ manifest, entryPath }: NormailzeMainfestEntryProps) {
  if (manifest.devtools_page || !entryPath) return;
  manifest.devtools_page = entryPath as string;
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

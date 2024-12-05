import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest } from '../manifest.js';
import type { NormailzeMainfestEntryProps } from './process.js';

export function mergeDevtoolsEntry({ manifest, entryPath }: NormailzeMainfestEntryProps) {
  if (manifest.devtools_page || !entryPath) return;
  manifest.devtools_page = entryPath as string;
}

export function getDevtoolsEntry(manifest: Manifest) {
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

export function writeDevtoolsEntry(manifest: Manifest, key: string) {
  manifest.devtools_page = `${key}.html`;
}

import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest } from '../manifest.js';
import type { NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './process.js';

export function mergeDevtoolsEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  if (!manifest.devtools_page && entryPath) {
    manifest.devtools_page = entryPath as string;
  }
}

export function getDevtoolsEntry(manifest: Manifest) {
  const devtools = manifest.devtools_page;
  if (!devtools) return null;
  const entry: RsbuildEntry = {
    devtools: {
      import: devtools,
      html: true,
    },
  };
  return entry;
}

export function writeDevtoolsEntry({ manifest, key }: WriteMainfestEntryProps) {
  manifest.devtools_page = `${key}.html`;
}

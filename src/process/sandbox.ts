import type { RsbuildEntry } from '@rsbuild/core';
import type { ManifestV3 } from '../manifest.js';
import type { NormailzeMainfestEntryProps } from './process.js';

export function mergeSandboxEntry({ manifest, entryPath }: NormailzeMainfestEntryProps) {
  const sandboxPages = manifest.sandbox?.pages;
  if (sandboxPages?.length || !entryPath) return;
  if (!manifest.sandbox) {
    manifest.sandbox = {
      pages: [],
    };
  }
  manifest.sandbox.pages = entryPath as string[];
}

export function getSandboxEntry(manifest: ManifestV3) {
  const entry: RsbuildEntry = {};

  const sandboxPages = manifest.sandbox?.pages || [];
  sandboxPages.forEach((page, index) => {
    const name = `sandbox${sandboxPages.length === 1 ? '' : index}`;
    entry[name] = {
      import: page,
      html: true,
    };
  });

  return entry;
}

export function writeSandboxEntry(manifest: ManifestV3, key: string) {
  if (!manifest.sandbox?.pages) return;
  const index = Number(key.replace('content', '') || '0');
  manifest.sandbox.pages[index] = `${key}.html`;
}

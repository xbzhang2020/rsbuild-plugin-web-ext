import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest, NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './manifest.js';

export function mergeSandboxEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  const sandboxPages = manifest.sandbox?.pages;
  if (sandboxPages?.length || !entryPath.length) return;
  if (!manifest.sandbox) {
    manifest.sandbox = {
      pages: [],
    };
  }
  manifest.sandbox.pages = entryPath;
}

export function getSandboxEntry(manifest: Manifest) {
  const sandboxPages = manifest.sandbox?.pages || [];
  if (!sandboxPages.length) return null;
  const entry: RsbuildEntry = {};
  sandboxPages.forEach((page, index) => {
    const name = `sandbox${sandboxPages.length === 1 ? '' : index}`;
    entry[name] = {
      import: page,
      html: true,
    };
  });
  return entry;
}

export function writeSandboxEntry({ manifest, entryName }: WriteMainfestEntryProps) {
  if (!manifest.sandbox?.pages) return;
  const index = Number(entryName.replace('sandbox', '') || '0');
  manifest.sandbox.pages[index] = `${entryName}.html`;
}

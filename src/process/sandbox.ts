import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest } from '../manifest.js';
import type { NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './process.js';

export function mergeSandboxEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  const sandboxPages = manifest.sandbox?.pages;
  if (sandboxPages?.length || !entryPath) return;
  if (!manifest.sandbox) {
    manifest.sandbox = {
      pages: [],
    };
  }
  manifest.sandbox.pages = entryPath as string[];
}

export function getSandboxEntry(manifest: Manifest) {
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

export function writeSandboxEntry({ manifest, key }: WriteMainfestEntryProps) {
  if (!manifest.sandbox?.pages) return;
  const index = Number(key.replace('content', '') || '0');
  manifest.sandbox.pages[index] = `${key}.html`;
}

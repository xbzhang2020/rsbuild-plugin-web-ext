import type { ManifestV3 } from '../manifest.js';
import type { RsbuildEntry } from '@rsbuild/core';

export function mergeSandboxEntry(manifest: ManifestV3, rootPath: string, filePath: string) {
  const sandboxPages = manifest.sandbox?.pages;
  if (sandboxPages?.length) return;
  if (!manifest.sandbox) {
    manifest.sandbox = {
      pages: [],
    };
  }
  manifest.sandbox.pages = [filePath];
}

export function getSandboxEntry(manifest: ManifestV3) {
  const entry: RsbuildEntry = {};

  const sandboxPages = manifest.sandbox?.pages;
  sandboxPages?.forEach((page, index) => {
    const name = `sandbox${index === 0 ? '' : index}`;
    entry[name] = {
      import: name,
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

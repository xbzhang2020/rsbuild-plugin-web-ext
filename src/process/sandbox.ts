import type { ManifestV3 } from '../manifest.js';

export function mergeSandboxEntry(manifest: ManifestV3, rootPath: string, filePaths: string[]) {
  const sandboxPages = manifest.sandbox?.pages;
  if (sandboxPages?.length) return;
  if (!manifest.sandbox) {
    manifest.sandbox = {
      pages: [],
    };
  }
  manifest.sandbox.pages = filePaths;
}

export function getSandboxEntry(manifest: ManifestV3) {
  const entry: Record<string, string | string[]> = {};

  const sandboxPages = manifest.sandbox?.pages || [];
  sandboxPages.forEach((page, index) => {
    const name = `sandbox${sandboxPages.length === 1 ? '' : index}`;
    entry[name] = page;
  });

  return entry;
}

export function writeSandboxEntry(manifest: ManifestV3, key: string) {
  if (!manifest.sandbox?.pages) return;
  const index = Number(key.replace('content', '') || '0');
  manifest.sandbox.pages[index] = `${key}.html`;
}

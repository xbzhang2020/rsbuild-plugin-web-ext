import type { ManifestV3 } from '../manifest.js';

export function mergeDevtoolsEntry(manifest: ManifestV3, rootPath: string, filePath: string) {
  if (manifest.devtools_page) return;
  manifest.devtools_page = filePath;
}

export function getDevtoolsEntry(manifest: ManifestV3) {
  const entry: Record<string, string | string[]> = {};

  const devtools = manifest.devtools_page;
  if (devtools) {
    entry.devtools = [devtools];
  }

  return entry;
}

export function writeDevtoolsEntry(manifest: ManifestV3, key: string) {
  manifest.devtools_page = `${key}.html`;
}

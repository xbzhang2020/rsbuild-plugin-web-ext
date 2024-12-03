import type { ManifestV3 } from '../manifest.js';

export function mergePopupEntry(manifest: ManifestV3, rootPath: string, filePath: string) {
  if (manifest.action?.default_popup) return;
  if (!manifest.action) {
    manifest.action = {};
  }
  manifest.action.default_popup = filePath;
}

export function getPopupEntry(manifest: ManifestV3) {
  const entry: Record<string, string | string[]> = {};
  const popup = manifest.action?.default_popup;
  if (popup) {
    entry.popup = popup;
  }

  return entry;
}

export function writePopupEntry(manifest: ManifestV3, key: string) {
  if (!manifest.action) return;
  manifest.action.default_popup = `${key}.html`;
}

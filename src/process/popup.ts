import type { ManifestV3 } from '../manifest.js';
import type { RsbuildEntry } from '@rsbuild/core';

export function mergePopupEntry(manifest: ManifestV3, rootPath: string, filePath: string) {
  if (manifest.action?.default_popup) return;
  if (!manifest.action) {
    manifest.action = {};
  }
  manifest.action.default_popup = filePath;
}

export function getPopupEntry(manifest: ManifestV3) {
  const entry: RsbuildEntry = {};

  const popup = manifest.action?.default_popup;
  if (popup) {
    entry.popup = {
      import: popup,
      html: true,
    };
  }

  return entry;
}

export function writePopupEntry(manifest: ManifestV3, key: string) {
  if (!manifest.action) return;
  manifest.action.default_popup = `${key}.html`;
}

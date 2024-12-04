import type { RsbuildEntry } from '@rsbuild/core';
import type { ManifestV3 } from '../manifest.js';
import type { NormailzeMainfestEntryProps } from './process.js';

export function mergePopupEntry({ manifest, entryPath }: NormailzeMainfestEntryProps) {
  if (manifest.action?.default_popup || !entryPath) return;
  if (!manifest.action) {
    manifest.action = {};
  }
  manifest.action.default_popup = entryPath as string;
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

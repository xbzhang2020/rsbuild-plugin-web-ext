import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest } from '../manifest.js';
import type { NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './process.js';

export function mergePopupEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  // TODO: support mv2
  if (manifest.action?.default_popup || !entryPath) return;
  if (!manifest.action) {
    manifest.action = {};
  }
  manifest.action.default_popup = entryPath as string;
}

export function getPopupEntry(manifest: Manifest) {
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

export function writePopupEntry({ manifest, key }: WriteMainfestEntryProps) {
  if (!manifest.action) return;
  manifest.action.default_popup = `${key}.html`;
}

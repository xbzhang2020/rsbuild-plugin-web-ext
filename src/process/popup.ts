import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest } from '../manifest.js';
import type { NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './process.js';

export function mergePopupEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  if (!entryPath) return;
  const { manifest_version } = manifest;
  if (manifest_version === 2) {
    if (!manifest.browser_action) {
      manifest.browser_action = {};
    }
    manifest.browser_action.default_popup = manifest.browser_action.default_popup || (entryPath as string);
    return;
  }

  if (!manifest.action) {
    manifest.action = {};
  }
  manifest.action.default_popup = manifest.action?.default_popup || (entryPath as string);
}

export function getPopupEntry(manifest: Manifest) {
  const entry: RsbuildEntry = {};
  const { manifest_version, action, browser_action } = manifest;

  const popup = manifest_version === 2 ? browser_action?.default_popup : action?.default_popup;
  if (popup) {
    entry.popup = {
      import: popup,
      html: true,
    };
  }

  return entry;
}

export function writePopupEntry({ manifest, key }: WriteMainfestEntryProps) {
  const { manifest_version, action, browser_action } = manifest;
  const popup = `${key}.html`;
  if (manifest_version === 2) {
    if (!browser_action) return;
    browser_action.default_popup = popup;
    return;
  }

  if (!action) return;
  action.default_popup = popup;
}

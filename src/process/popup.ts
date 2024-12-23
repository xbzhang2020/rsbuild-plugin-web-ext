import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest, NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './manifest.js';

export function mergePopupEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  if (!entryPath.length) return;
  const { manifest_version } = manifest;
  if (manifest_version === 2) {
    if (!manifest.browser_action) {
      manifest.browser_action = {};
    }
    manifest.browser_action.default_popup = manifest.browser_action.default_popup || entryPath[0];
    return;
  }

  if (!manifest.action) {
    manifest.action = {};
  }
  manifest.action.default_popup = manifest.action?.default_popup || entryPath[0];
}

export function getPopupEntry(manifest: Manifest) {
  const { manifest_version, action, browser_action } = manifest;

  const popup = manifest_version === 2 ? browser_action?.default_popup : action?.default_popup;
  if (!popup) return null;
  const entry: RsbuildEntry = {
    popup: {
      import: popup,
      html: true,
    },
  };
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

import type { RsbuildEntry } from '@rsbuild/core';
import type { ManifestV3 } from '../manifest.js';

export function mergeOptionsEntry(manifest: ManifestV3, rootPath: string, filePath: string) {
  const options = manifest.options_ui?.page || manifest.options_page;
  if (options) return;

  if (!manifest.options_ui) {
    manifest.options_ui = {
      open_in_tab: true,
    };
  }
  manifest.options_ui.page = filePath;
}

export function getOptionsEntry(manifest: ManifestV3) {
  const entry: RsbuildEntry = {};
  const options = manifest.options_ui?.page || manifest.options_page;
  if (options) {
    entry.options = {
      import: options,
      html: true,
    };
  }

  return entry;
}

export function writeOptionsEntry(manifest: ManifestV3, key: string) {
  const filename = `${key}.html`;
  if (manifest.options_page) {
    manifest.options_page = filename;
  }
  if (manifest.options_ui) {
    manifest.options_ui.page = filename;
  }
}

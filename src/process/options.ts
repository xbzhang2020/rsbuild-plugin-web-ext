import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest } from '../manifest.js';
import type { NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './process.js';

export function mergeOptionsEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  const options = manifest.options_ui?.page || manifest.options_page;
  if (options || !entryPath) return;

  if (!manifest.options_ui) {
    manifest.options_ui = {
      open_in_tab: true,
    };
  }
  manifest.options_ui.page = entryPath as string;
}

export function getOptionsEntry(manifest: Manifest) {
  const options = manifest.options_ui?.page || manifest.options_page;
  if (!options) return null;
  const entry: RsbuildEntry = {};
  entry.options = {
    import: options,
    html: true,
  };
  return entry;
}

export function writeOptionsEntry({ manifest, key }: WriteMainfestEntryProps) {
  const filename = `${key}.html`;
  if (manifest.options_page) {
    manifest.options_page = filename;
  }
  if (manifest.options_ui) {
    manifest.options_ui.page = filename;
  }
}

import type { RsbuildEntry } from '@rsbuild/core';
import { parseExportObject } from '../parser/export.js';
import { readFileContent } from '../util.js';
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

export function getPopupEntry(manifest?: Manifest) {
  const { manifest_version, action, browser_action } = manifest || {};
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

export async function writePopupEntry({
  manifest,
  optionManifest,
  entryName,
  entryPath,
  rootPath,
}: WriteMainfestEntryProps) {
  const { manifest_version, action, browser_action } = manifest;

  const declarative = !getPopupEntry(optionManifest) && !!entryPath;
  let title: string | null = null;

  if (declarative) {
    const filePath = Array.isArray(entryPath) ? entryPath[0] : entryPath;
    const code = await readFileContent(rootPath, filePath);
    title = parseExportObject<string>(code, 'title');
  }

  const popup = `${entryName}.html`;
  if (manifest_version === 2) {
    if (!browser_action) return;
    browser_action.default_popup = popup;
    if (title) {
      browser_action.default_title = title;
    }
    return;
  }

  if (!action) return;
  action.default_popup = popup;
  if (title) {
    action.default_title = title;
  }
}

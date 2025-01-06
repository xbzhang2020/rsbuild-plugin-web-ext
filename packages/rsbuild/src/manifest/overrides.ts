import type { Manifest } from 'webextension-polyfill';
import type { ManifestEntryInput, ManifestEntryProcessor, PageToOverride } from './types.js';
import { getEntryFiles } from './util.js';

const overrides: PageToOverride[] = ['newtab', 'history', 'bookmarks'];

const mergeOverridesEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, files }) => {
  const { chrome_url_overrides = {} } = manifest;
  if (Object.keys(chrome_url_overrides).length) return;

  for (const key of overrides) {
    const pattern = [new RegExp(`^${key}([\\/]index)?\.(ts|tsx|js|jsx|mjs|cjs)$`)];
    const entryPath = getEntryFiles({ files, pattern, rootPath, srcDir });
    if (entryPath[0]) {
      manifest.chrome_url_overrides = {
        ...(manifest.chrome_url_overrides || {}),
        [key]: entryPath[0],
      };
    }
  }
};

const readOverridesEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { chrome_url_overrides } = manifest || {};
  if (!chrome_url_overrides) return null;

  const entry: ManifestEntryInput = {};
  for (const key of overrides) {
    const input = chrome_url_overrides[key as keyof Manifest.WebExtensionManifestChromeUrlOverridesType];
    if (!input) continue;

    entry[key] = {
      input: [input],
      html: true,
    };
  }
  return Object.keys(entry).length ? entry : null;
};

const writeOverridesEntry: ManifestEntryProcessor['write'] = ({ manifest, name }) => {
  const { chrome_url_overrides } = manifest;
  if (!chrome_url_overrides) return;

  const key = name as keyof Manifest.WebExtensionManifestChromeUrlOverridesType;
  if (chrome_url_overrides[key]) {
    chrome_url_overrides[key] = `${name}.html`;
  }
};

const overrideProcessors: ManifestEntryProcessor = {
  key: 'overrides',
  match: (entryName) => overrides.includes(entryName as PageToOverride),
  merge: mergeOverridesEntry,
  read: readOverridesEntry,
  write: writeOverridesEntry,
};

export default overrideProcessors;

import { getSingleEntryFilePath } from './util.js';
import type { ManifestEntry, ManifestEntryProcessor, PageToOverride } from './manifest.js';

const overrides: PageToOverride[] = ['newtab', 'history', 'bookmarks'];

const mergeOverridesEntry: ManifestEntryProcessor['merge'] = async ({ manifest, srcPath, files }) => {
  const { chrome_url_overrides = {} } = manifest;
  if (Object.keys(chrome_url_overrides).length) return;

  for (const key of overrides) {
    const entryPath = await getSingleEntryFilePath(srcPath, files, key);
    if (!entryPath.length) continue;

    manifest.chrome_url_overrides ??= {};
    manifest.chrome_url_overrides[key] = entryPath[0];
  }
};

const readOverridesEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { chrome_url_overrides } = manifest || {};
  if (!chrome_url_overrides) return null;

  const entry: ManifestEntry = {};
  for (const key of overrides) {
    const input = chrome_url_overrides[key];
    if (!input) continue;

    entry[key] = {
      import: input,
      html: true,
    };
  }
  return Object.keys(entry).length ? entry : null;
};

const writeOverridesEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName }) => {
  const { chrome_url_overrides } = manifest;
  if (!chrome_url_overrides) return;

  const key = entryName as PageToOverride;
  if (!overrides.includes(key)) return;

  chrome_url_overrides[key] = `${entryName}.html`;
};

const overrideProcessors: ManifestEntryProcessor = {
  key: 'overrides',
  match: (entryName) => overrides.includes(entryName as PageToOverride),
  merge: mergeOverridesEntry,
  read: readOverridesEntry,
  write: writeOverridesEntry,
};

export default overrideProcessors;

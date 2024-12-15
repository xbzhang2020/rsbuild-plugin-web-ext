import { getSingleEntryFilePath } from '../util.js';
import type { ManifestEntry, ManifestEntryProcessor, PageToOverride } from './manifest.js';

const createMergeEntry = (key: PageToOverride): ManifestEntryProcessor['merge'] => {
  return async ({ manifest, srcPath, files }) => {
    const { chrome_url_overrides } = manifest;
    if (chrome_url_overrides?.[key]) return;

    const entryPath = await getSingleEntryFilePath(srcPath, files, key);
    if (!entryPath.length) return;

    manifest.chrome_url_overrides ??= {};
    manifest.chrome_url_overrides[key] = entryPath[0];
  };
};

const createReadEntry = (key: PageToOverride): ManifestEntryProcessor['read'] => {
  return (manifest) => {
    const { chrome_url_overrides } = manifest || {};
    const input = chrome_url_overrides?.[key];
    if (!input) return null;

    const entry: ManifestEntry = {
      [key]: {
        import: input,
        html: true,
      },
    };
    return entry;
  };
};

const createWriteEntry = (key: PageToOverride): ManifestEntryProcessor['write'] => {
  return ({ manifest, entryName }) => {
    const output = `${entryName}.html`;
    const { chrome_url_overrides } = manifest;
    if (chrome_url_overrides) {
      chrome_url_overrides[key] = output;
    }
  };
};

const overrides: PageToOverride[] = ['newtab', 'history', 'bookmarks'];
const overrideProcessors: ManifestEntryProcessor[] = overrides.map((key) => ({
  key,
  match: (entryName) => entryName === key,
  merge: createMergeEntry(key),
  read: createReadEntry(key),
  write: createWriteEntry(key),
}));

export default overrideProcessors;

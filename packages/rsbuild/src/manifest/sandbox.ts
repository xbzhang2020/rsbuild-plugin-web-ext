import type { ManifestEntryInput, ManifestEntryProcessor } from './types.js';
import { GLOB_JS_EXT, getGlobFiles } from './util.js';

const key = 'sandbox';
const globPaths = [
  `${key}${GLOB_JS_EXT}`,
  `${key}/index${GLOB_JS_EXT}`,
  `sandboxes/*${GLOB_JS_EXT}`,
  `sandboxes/*/index${GLOB_JS_EXT}`,
];

const mergeSandboxEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, target }) => {
  const pages = manifest.sandbox?.pages;
  if (pages?.length || target.includes('firefox')) return;

  const entryPath = await getGlobFiles(rootPath, srcDir, globPaths);
  if (entryPath.length) {
    manifest.sandbox = {
      ...(manifest.sandbox || {}),
      pages: entryPath,
    };
  }
};

const readSandboxEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const pages = manifest?.sandbox?.pages || [];
  if (!pages.length) return null;

  const entry: ManifestEntryInput = {};
  pages.forEach((page, index) => {
    const name = `sandbox${pages.length === 1 ? '' : index}`;
    entry[name] = {
      input: [page],
      html: true,
    };
  });
  return entry;
};

const writeSandboxEntry: ManifestEntryProcessor['write'] = ({ manifest, name }) => {
  const pages = manifest?.sandbox?.pages || [];
  if (!pages.length) return;

  const index = Number(name.replace('sandbox', '') || '0');
  if (pages[index]) {
    pages[index] = `${name}.html`;
  }
};

const sandboxProcessor: ManifestEntryProcessor = {
  key: 'sandbox',
  globPaths,
  match: (entryName) => entryName.startsWith('sandbox'),
  merge: mergeSandboxEntry,
  read: readSandboxEntry,
  write: writeSandboxEntry,
};

export default sandboxProcessor;

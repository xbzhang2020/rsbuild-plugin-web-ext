import type { ManifestEntryInput, ManifestEntryProcessor } from './types.js';
import { getEntryFiles } from './util.js';

const key = 'sandbox';

const pattern = [
  /^sandbox([\\/]index)?\.(ts|tsx|js|jsx|mjs|cjs)$/,
  /^sandboxes[\\/][^\\/]+([\\/]index)?\.(ts|tsx|js|jsx|mjs|cjs)$/,
];

const mergeSandboxEntry: ManifestEntryProcessor['merge'] = async ({ manifest, srcPath, target, files }) => {
  const pages = manifest.sandbox?.pages;
  if (pages?.length || target.includes('firefox')) return;

  const entryPath = getEntryFiles(srcPath, files, pattern);
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
  key,
  match: (entryName) => entryName.startsWith(key),
  merge: mergeSandboxEntry,
  read: readSandboxEntry,
  write: writeSandboxEntry,
};

export default sandboxProcessor;

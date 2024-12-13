import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';

const mergeSandboxEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  const sandboxPages = manifest.sandbox?.pages;
  if (sandboxPages?.length || !entryPath.length) return;
  if (!manifest.sandbox) {
    manifest.sandbox = {
      pages: [],
    };
  }
  manifest.sandbox.pages = entryPath;
};

const getSandboxEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const sandboxPages = manifest?.sandbox?.pages || [];
  if (!sandboxPages.length) return null;
  const entry: ManifestEntry = {};
  sandboxPages.forEach((page, index) => {
    const name = `sandbox${sandboxPages.length === 1 ? '' : index}`;
    entry[name] = {
      import: page,
      html: true,
    };
  });
  return entry;
};

const writeSandboxEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName }) => {
  if (!manifest.sandbox?.pages) return;
  const index = Number(entryName.replace('sandbox', '') || '0');
  manifest.sandbox.pages[index] = `${entryName}.html`;
};

const sandboxProcessor: ManifestEntryProcessor = {
  key: 'sandbox',
  match: (entryName) => entryName.startsWith('sandbox'),
  merge: mergeSandboxEntry,
  read: getSandboxEntry,
  write: writeSandboxEntry,
};

export default sandboxProcessor;

import type { ManifestEntry, ManifestEntryProcessor } from './types.js';
import { getMultipleEntryFiles, getSingleEntryFile } from './util.js';

const mergeSandboxEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, files, target }) => {
  const pages = manifest.sandbox?.pages;
  if (pages?.length || target.includes('firefox')) return;

  const entryPath: string[] = [];
  const singleEntryPath = await getSingleEntryFile(rootPath, srcDir, files, 'sandbox');
  if (singleEntryPath) entryPath.push(singleEntryPath);
  const multipleEntryPath = await getMultipleEntryFiles(rootPath, srcDir, files, 'sandboxes');
  if (multipleEntryPath) entryPath.push(...multipleEntryPath);

  if (!entryPath.length) return;
  manifest.sandbox = {
    ...(manifest.sandbox || {}),
    pages: entryPath,
  };
};

const readSandboxEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const pages = manifest?.sandbox?.pages || [];
  if (!pages.length) return null;

  const entry: ManifestEntry = {};
  pages.forEach((page, index) => {
    const name = `sandbox${pages.length === 1 ? '' : index}`;
    entry[name] = {
      import: page,
      html: true,
    };
  });
  return entry;
};

const writeSandboxEntry: ManifestEntryProcessor['write'] = ({ manifest, entry }) => {
  const pages = manifest?.sandbox?.pages || [];
  if (!pages.length || !entry) return;
  for (const entryName in entry) {
    const index = Number(entryName.replace('sandbox', '') || '0');
    pages[index] = `${entryName}.html`;
  }
};

const sandboxProcessor: ManifestEntryProcessor = {
  key: 'sandbox',
  match: (entryName) => entryName.startsWith('sandbox'),
  merge: mergeSandboxEntry,
  read: readSandboxEntry,
  write: writeSandboxEntry,
};

export default sandboxProcessor;

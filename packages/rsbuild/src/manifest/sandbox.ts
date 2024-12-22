import type { ManifestEntryInput, ManifestEntryProcessor } from './types.js';
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
  match: (entryName) => entryName.startsWith('sandbox'),
  merge: mergeSandboxEntry,
  read: readSandboxEntry,
  write: writeSandboxEntry,
};

export default sandboxProcessor;

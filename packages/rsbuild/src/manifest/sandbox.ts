import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';
import { getMultipleEntryFilePath, getSingleEntryFilePath } from './util.js';

const mergeSandboxEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, files }) => {
  const pages = manifest.sandbox?.pages;
  if (pages?.length) return;

  const entryPath: string[] = [];
  const singleEntryPath = await getSingleEntryFilePath(rootPath, srcDir, files, 'sandbox');
  if (singleEntryPath) entryPath.push(singleEntryPath);
  const multipleEntryPath = await getMultipleEntryFilePath(rootPath, srcDir, files, 'sandboxes');
  if (multipleEntryPath) entryPath.push(...multipleEntryPath);

  if (!entryPath.length) return;

  manifest.sandbox ??= {
    pages: [],
  };
  manifest.sandbox.pages = entryPath;
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

const writeSandboxEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName }) => {
  const pages = manifest?.sandbox?.pages || [];
  if (!pages.length) return;
  const index = Number(entryName.replace('sandbox', '') || '0');
  pages[index] = `${entryName}.html`;
};

const sandboxProcessor: ManifestEntryProcessor = {
  key: 'sandbox',
  match: (entryName) => entryName.startsWith('sandbox'),
  merge: mergeSandboxEntry,
  read: readSandboxEntry,
  write: writeSandboxEntry,
};

export default sandboxProcessor;

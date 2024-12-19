import type { ManifestEntry, ManifestEntryProcessor } from './types.js';
import { getSingleEntryFile } from './util.js';

const mergeDevtoolsEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, files }) => {
  const { devtools_page } = manifest;
  if (devtools_page) return;

  const entryPath = await getSingleEntryFile(rootPath, srcDir, files, 'devtools');
  if (!entryPath) return;
  manifest.devtools_page = entryPath;
};

const readDevtoolsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { devtools_page } = manifest || {};
  if (!devtools_page) return null;
  const entry: ManifestEntry = {
    devtools: {
      import: devtools_page,
      html: true,
    },
  };
  return entry;
};

const writeDevtoolsEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName }) => {
  manifest.devtools_page = `${entryName}.html`;
};

const devtoolsProcessor: ManifestEntryProcessor = {
  key: 'devtools',
  match: (entryName) => entryName === 'devtools',
  merge: mergeDevtoolsEntry,
  read: readDevtoolsEntry,
  write: writeDevtoolsEntry,
};

export default devtoolsProcessor;

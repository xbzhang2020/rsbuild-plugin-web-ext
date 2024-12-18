import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';
import { getSingleEntryFilePath } from './util.js';

const mergeDevtoolsEntry: ManifestEntryProcessor['merge'] = async ({ manifest, srcPath, files }) => {
  const { devtools_page } = manifest;
  if (devtools_page) return;

  const entryPath = await getSingleEntryFilePath(srcPath, files, 'devtools');
  if (!entryPath.length) return;
  manifest.devtools_page = entryPath[0];
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

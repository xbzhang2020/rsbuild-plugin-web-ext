import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';

const mergeDevtoolsEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  if (!manifest.devtools_page && entryPath.length) {
    manifest.devtools_page = entryPath[0];
  }
};

const getDevtoolsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const input = manifest?.devtools_page;
  if (!input) return null;
  const entry: ManifestEntry = {
    devtools: {
      import: input,
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
  read: getDevtoolsEntry,
  write: writeDevtoolsEntry,
};

export default devtoolsProcessor;

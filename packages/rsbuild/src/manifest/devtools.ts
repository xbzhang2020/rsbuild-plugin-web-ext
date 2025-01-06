import type { ManifestEntryInput, ManifestEntryProcessor } from './types.js';
import { getEntryFiles } from './util.js';

const key = 'devtools';
const pattern = [/^devtools([\\/]index)?\.(ts|tsx|js|jsx|mjs|cjs)$/];

const mergeDevtoolsEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, files }) => {
  const { devtools_page } = manifest;
  if (devtools_page) return;

  const entryPath = getEntryFiles({ files, pattern, rootPath, srcDir });
  if (entryPath[0]) {
    manifest.devtools_page = entryPath[0];
  }
};

const readDevtoolsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { devtools_page } = manifest || {};
  if (!devtools_page) return null;
  const entry: ManifestEntryInput = {
    devtools: {
      input: [devtools_page],
      html: true,
    },
  };
  return entry;
};

const writeDevtoolsEntry: ManifestEntryProcessor['write'] = ({ manifest, name }) => {
  manifest.devtools_page = `${name}.html`;
};

const devtoolsProcessor: ManifestEntryProcessor = {
  key,
  match: (entryName) => entryName === 'devtools',
  merge: mergeDevtoolsEntry,
  read: readDevtoolsEntry,
  write: writeDevtoolsEntry,
};

export default devtoolsProcessor;

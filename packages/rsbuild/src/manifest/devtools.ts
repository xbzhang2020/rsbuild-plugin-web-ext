import type { ManifestEntryInput, ManifestEntryProcessor } from './types.js';
import { GLOB_JS_EXT, getGlobFiles } from './util.js';

const key = 'devtools';
const globPaths = [`${key}${GLOB_JS_EXT}`, `${key}/index${GLOB_JS_EXT}`];

const mergeDevtoolsEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir }) => {
  const { devtools_page } = manifest;
  if (devtools_page) return;

  const entryPath = await getGlobFiles(rootPath, srcDir, globPaths);
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

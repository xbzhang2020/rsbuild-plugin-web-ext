import type { ManifestEntryInput, ManifestEntryProcessor } from './types.js';
import { GLOB_JS_EXT, getGlobFiles } from './util.js';

const key = 'options';
const globPaths = [`${key}${GLOB_JS_EXT}`, `${key}/index${GLOB_JS_EXT}`];

const mergeOptionsEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir }) => {
  const { options_ui, options_page } = manifest;
  if (options_ui?.page || options_page) return;

  const entryPath = await getGlobFiles(rootPath, srcDir, globPaths);
  if (entryPath[0]) {
    manifest.options_ui = {
      ...(options_ui || {}),
      page: entryPath[0],
    };
  }
};

const readOptionsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { options_ui, options_page } = manifest || {};
  const input = options_ui?.page || options_page;
  if (!input) return null;

  const entry: ManifestEntryInput = {
    options: {
      input: [input],
      html: true,
    },
  };
  return entry;
};

const writeOptionsEntry: ManifestEntryProcessor['write'] = ({ manifest, name }) => {
  const output = `${name}.html`;
  if (manifest.options_page) {
    manifest.options_page = output;
  }
  if (manifest.options_ui) {
    manifest.options_ui.page = output;
  }
};

const optionsProcessor: ManifestEntryProcessor = {
  key,
  globPaths,
  match: (entryName) => entryName === 'options',
  merge: mergeOptionsEntry,
  read: readOptionsEntry,
  write: writeOptionsEntry,
};

export default optionsProcessor;

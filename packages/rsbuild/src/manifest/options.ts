import type { ManifestEntry, ManifestEntryProcessor } from './types.js';
import { getSingleEntryFile } from './util.js';

const mergeOptionsEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, files }) => {
  const { options_ui, options_page } = manifest;
  if (options_ui?.page || options_page) return;

  const entryPath = await getSingleEntryFile(rootPath, srcDir, files, 'options');
  if (!entryPath) return;

  manifest.options_ui = {
    ...(options_ui || {}),
    page: entryPath,
  };
};

const readOptionsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { options_ui, options_page } = manifest || {};
  const input = options_ui?.page || options_page;
  if (!input) return null;

  const entry: ManifestEntry = {
    options: {
      import: input,
      html: true,
    },
  };
  return entry;
};

const writeOptionsEntry: ManifestEntryProcessor['write'] = ({ manifest }) => {
  const output = 'options.html';
  if (manifest.options_page) {
    manifest.options_page = output;
  }
  if (manifest.options_ui) {
    manifest.options_ui.page = output;
  }
};

const optionsProcessor: ManifestEntryProcessor = {
  key: 'options',
  match: (entryName) => entryName === 'options',
  merge: mergeOptionsEntry,
  read: readOptionsEntry,
  write: writeOptionsEntry,
};

export default optionsProcessor;

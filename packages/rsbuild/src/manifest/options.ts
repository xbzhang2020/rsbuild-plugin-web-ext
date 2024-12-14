import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';

const mergeOptionsEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  const options = manifest.options_ui?.page || manifest.options_page;
  if (options || !entryPath.length) return;

  manifest.options_ui ??= {};
  manifest.options_ui.page = entryPath[0];
};

const getOptionsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const input = manifest?.options_ui?.page || manifest?.options_page;
  if (!input) return null;
  const entry: ManifestEntry = {};
  entry.options = {
    import: input,
    html: true,
  };
  return entry;
};

const writeOptionsEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName }) => {
  const output = `${entryName}.html`;
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
  read: getOptionsEntry,
  write: writeOptionsEntry,
};

export default optionsProcessor;

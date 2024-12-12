import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';

const mergeOptionsEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  const options = manifest.options_ui?.page || manifest.options_page;
  if (options || !entryPath.length) return;

  if (!manifest.options_ui) {
    manifest.options_ui = {
      open_in_tab: true,
    };
  }
  manifest.options_ui.page = entryPath[0];
};

const getOptionsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const options = manifest?.options_ui?.page || manifest?.options_page;
  if (!options) return null;
  const entry: ManifestEntry = {};
  entry.options = {
    import: options,
    html: true,
  };
  return entry;
};

const writeOptionsEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName }) => {
  const filename = `${entryName}.html`;
  if (manifest.options_page) {
    manifest.options_page = filename;
  }
  if (manifest.options_ui) {
    manifest.options_ui.page = filename;
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

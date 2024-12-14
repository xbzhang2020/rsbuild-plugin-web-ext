import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';

const mergeSidepanelEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath, target }) => {
  if (!entryPath.length) return;
  const { side_panel, sidebar_action } = manifest;

  if (target.includes('firefox')) {
    if (sidebar_action?.default_panel) return;
    manifest.sidebar_action ??= {};
    manifest.sidebar_action.default_panel = entryPath[0];
    return;
  }

  if (side_panel?.default_path) return;
  manifest.side_panel ??= {};
  manifest.side_panel.default_path = entryPath[0];
};

const getSidepanelEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { side_panel, sidebar_action } = manifest || {};
  const input = side_panel?.default_path || sidebar_action?.default_panel;

  if (!input) return null;
  const entry: ManifestEntry = {
    sidepanel: {
      import: input,
      html: true,
    },
  };
  return entry;
};

const writeSidepanelEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName }) => {
  const output = `${entryName}.html`;
  const { side_panel, sidebar_action } = manifest;
  if (side_panel) {
    side_panel.default_path = output;
  }
  if (sidebar_action) {
    sidebar_action.default_panel = output;
  }
};

const sidepanelProcessor: ManifestEntryProcessor = {
  key: 'sidepanel',
  match: (entryName) => entryName === 'sidepanel',
  merge: mergeSidepanelEntry,
  read: getSidepanelEntry,
  write: writeSidepanelEntry,
};

export default sidepanelProcessor;

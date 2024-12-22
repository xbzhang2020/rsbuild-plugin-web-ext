import type { ManifestEntry, ManifestEntryProcessor } from './types.js';
import { getSingleEntryFile } from './util.js';

const mergeSidepanelEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, files, target }) => {
  const { side_panel, sidebar_action } = manifest;
  if (side_panel?.default_path || sidebar_action?.default_panel) return;

  const entryPath = await getSingleEntryFile(rootPath, srcDir, files, 'sidepanel');
  if (!entryPath) return;

  if (target.includes('firefox')) {
    manifest.sidebar_action = {
      default_panel: entryPath,
      ...(sidebar_action || {}),
    };
    return;
  }

  manifest.side_panel = {
    default_path: entryPath,
    ...(side_panel || {}),
  };
};

const readSidepanelEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { side_panel, sidebar_action } = manifest || {};
  const input = side_panel?.default_path || sidebar_action?.default_panel;
  if (!input) return null;

  const entry: ManifestEntry = {
    sidepanel: {
      input: [input],
      html: true,
    },
  };
  return entry;
};

const writeSidepanelEntry: ManifestEntryProcessor['write'] = ({ manifest, name }) => {
  const output = `${name}.html`;
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
  read: readSidepanelEntry,
  write: writeSidepanelEntry,
};

export default sidepanelProcessor;

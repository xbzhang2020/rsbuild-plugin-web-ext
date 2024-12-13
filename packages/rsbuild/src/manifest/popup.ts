import { parseExportObject } from '../parser/export.js';
import { readFileContent } from '../util.js';
import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';

const mergePopupEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  if (!entryPath.length) return;
  const { manifest_version } = manifest;
  if (manifest_version === 2) {
    if (!manifest.browser_action) {
      manifest.browser_action = {};
    }
    manifest.browser_action.default_popup = manifest.browser_action.default_popup || entryPath[0];
    return;
  }

  if (!manifest.action) {
    manifest.action = {};
  }
  manifest.action.default_popup = manifest.action?.default_popup || entryPath[0];
};

const getPopupEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { manifest_version, action, browser_action } = manifest || {};
  const popup = manifest_version === 2 ? browser_action?.default_popup : action?.default_popup;
  if (!popup) return null;
  const entry: ManifestEntry = {
    popup: {
      import: popup,
      html: true,
    },
  };
  return entry;
};

const writePopupEntry: ManifestEntryProcessor['write'] = async ({
  manifest,
  optionManifest,
  entryName,
  entrypoint,
  rootPath,
}) => {
  const { manifest_version, action, browser_action } = manifest;
  const { input } = entrypoint;

  const declarative = !getPopupEntry(optionManifest) && !!input;
  let title: string | null = null;

  if (declarative) {
    const filePath = Array.isArray(input) ? input[0] : input;
    const code = await readFileContent(rootPath, filePath);
    title = parseExportObject<string>(code, 'title');
  }

  const popup = `${entryName}.html`;
  if (manifest_version === 2) {
    if (!browser_action) return;
    browser_action.default_popup = popup;
    if (title) {
      browser_action.default_title = title;
    }
    return;
  }

  if (!action) return;
  action.default_popup = popup;
  if (title) {
    action.default_title = title;
  }
};

const popupProcessor: ManifestEntryProcessor = {
  key: 'popup',
  match: (entryName) => entryName === 'popup',
  merge: mergePopupEntry,
  read: getPopupEntry,
  write: writePopupEntry,
};

export default popupProcessor;

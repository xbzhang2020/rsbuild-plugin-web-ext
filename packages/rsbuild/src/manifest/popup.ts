import { parseExportObject } from './parser/export.js';
import type { ManifestEntryInput, ManifestEntryProcessor } from './types.js';
import { getFileContent, getSingleEntryFile } from './util.js';

const key = 'popup';

const normalizePopupEntry: ManifestEntryProcessor['normalize'] = async ({ manifest, srcPath, files }) => {
  const { manifest_version } = manifest;

  const entryPath = await getSingleEntryFile(srcPath, files, key);
  if (entryPath) {
    if (manifest_version === 2) {
      manifest.browser_action ??= {};
      manifest.browser_action.default_popup ??= entryPath;
      return;
    }

    manifest.action ??= {};
    manifest.action.default_popup ??= entryPath;
  }
};

const readPopupEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { manifest_version, action, browser_action } = manifest || {};
  const pointer = manifest_version === 2 ? browser_action : action;
  const input = pointer?.default_popup;
  if (!input) return null;

  const entry: ManifestEntryInput = {
    popup: {
      input: [input],
      html: true,
    },
  };
  return entry;
};

const writePopupEntry: ManifestEntryProcessor['write'] = async ({ manifest, rootPath, name, input }) => {
  const { manifest_version, action, browser_action } = manifest;
  const pointer = manifest_version === 2 ? browser_action : action;
  if (!pointer) return;

  const { default_title } = pointer;
  if (!default_title && input?.[0]) {
    const code = await getFileContent(rootPath, input[0]);
    const title = parseExportObject<string>(code, 'title');
    if (title) {
      pointer.default_title = title;
    }
  }

  pointer.default_popup = `${name}.html`;
};

const popupProcessor: ManifestEntryProcessor = {
  key,
  match: (entryName) => entryName === key,
  normalize: normalizePopupEntry,
  read: readPopupEntry,
  write: writePopupEntry,
};

export default popupProcessor;

import { parseExportObject } from '../parser/export.js';
import type { ContentScriptConfig } from '../types.js';
import { readFileContent } from '../util.js';
import type { ManifestEntryProcessor, ManifestEntry } from './manifest.js';

const mergeContentEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  const { content_scripts } = manifest;

  if (!content_scripts?.length && entryPath.length) {
    if (!manifest.content_scripts) {
      manifest.content_scripts = [];
    }

    for (const filePath of entryPath) {
      manifest.content_scripts.push({
        js: [filePath],
      });
    }
  }
};

const getContentEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { content_scripts = [] } = manifest || {};
  if (!content_scripts.length) return null;

  const entry: ManifestEntry = {};
  content_scripts.forEach((contentScript, index) => {
    const name = `content${content_scripts.length === 1 ? '' : index}`;
    const { js = [], css = [] } = contentScript;
    entry[name] = {
      import: [...js, ...css],
      html: false,
    };
  });
  return entry;
};

const writeContentEntry: ManifestEntryProcessor['write'] = async ({
  manifest,
  optionManifest,
  rootPath,
  entryPath,
  entryName,
  assets,
}) => {
  const { content_scripts } = manifest;
  if (!content_scripts) return;
  const index = Number(entryName.replace('content', '') || '0');

  const declarative = !getContentEntry(optionManifest) && !!entryPath;
  if (declarative) {
    // declarative entry is a sinlge file
    const filePath = Array.isArray(entryPath) ? entryPath[0] : entryPath;
    const code = await readFileContent(rootPath, filePath);
    const extraConfig = parseExportObject<ContentScriptConfig>(code, 'config') || {
      matches: ['<all_urls>'],
    };

    if (extraConfig) {
      content_scripts[index] = {
        ...content_scripts[index],
        ...extraConfig,
      };
    }
  }

  const item = content_scripts[index];
  item.js = assets.filter((item) => item.endsWith('.js'));
  item.css = assets.filter((item) => item.endsWith('.css'));
};

const contentProcessor: ManifestEntryProcessor = {
  key: 'content',
  match: (entryName) => entryName.startsWith('content'),
  merge: mergeContentEntry,
  read: getContentEntry,
  write: writeContentEntry,
};

export default contentProcessor;

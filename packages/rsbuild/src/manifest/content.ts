import type { ContentScriptConfig, ManifestEntry, ManifestEntryProcessor } from './manifest.js';
import { parseExportObject } from './parser/export.js';
import { getMultipleEntryFilePath, getSingleEntryFilePath, readFileContent } from './util.js';

const mergeContentEntry: ManifestEntryProcessor['merge'] = async ({ manifest, rootPath, srcDir, files }) => {
  const { content_scripts } = manifest;
  if (content_scripts?.length) return;

  const entryPath: string[] = [];
  const singleEntryPath = await getSingleEntryFilePath(rootPath, srcDir, files, 'content');
  if (singleEntryPath) {
    entryPath.push(singleEntryPath);
  }

  const multipleEntryPath = await getMultipleEntryFilePath(rootPath, srcDir, files, 'contents');
  if (multipleEntryPath) {
    entryPath.push(...multipleEntryPath);
  }

  if (!entryPath.length) return;

  manifest.content_scripts ??= [];
  for (const filePath of entryPath) {
    manifest.content_scripts.push({
      js: [filePath],
    });
  }
};

const readContentEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { content_scripts } = manifest || {};
  if (!content_scripts?.length) return null;

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
  rootPath,
  entryPath,
  assets,
  entryName,
}) => {
  const { content_scripts } = manifest;
  if (!content_scripts?.length || !assets?.length) return;

  const index = Number(entryName.replace('content', '') || '0');
  const { matches } = content_scripts[index];
  const input = Array.isArray(entryPath) ? entryPath[0] : entryPath;

  if (!matches?.length && input) {
    const code = await readFileContent(rootPath, input);
    const config = parseExportObject<ContentScriptConfig>(code, 'config') || {
      matches: ['<all_urls>'],
    };
    content_scripts[index] = {
      ...content_scripts[index],
      ...config,
    };
  }

  content_scripts[index].js = assets.filter((item) => item.endsWith('.js'));
  content_scripts[index].css = assets.filter((item) => item.endsWith('.css'));
};

const contentProcessor: ManifestEntryProcessor = {
  key: 'content',
  match: (entryName) => entryName.startsWith('content'),
  merge: mergeContentEntry,
  read: readContentEntry,
  write: writeContentEntry,
};

export default contentProcessor;

import { resolve } from 'node:path';
import { parseExportObject } from './parser/export.js';
import type { ContentScriptConfig, ManifestEntry, ManifestEntryProcessor } from './types.js';
import { getFileContent, getMultipleEntryFiles, getSingleEntryFile, isDevMode } from './util.js';

const mergeContentEntry: ManifestEntryProcessor['merge'] = async ({
  manifest,
  rootPath,
  srcDir,
  files,
  mode,
  // selfRootPath,
}) => {
  const { content_scripts } = manifest;

  if (!content_scripts?.length) {
    const entryPath: string[] = [];
    const singleEntryPath = await getSingleEntryFile(rootPath, srcDir, files, 'content');
    if (singleEntryPath) {
      entryPath.push(singleEntryPath);
    }

    const multipleEntryPath = await getMultipleEntryFiles(rootPath, srcDir, files, 'contents');
    if (multipleEntryPath) {
      entryPath.push(...multipleEntryPath);
    }

    if (entryPath.length) {
      manifest.content_scripts ??= [];
      for (const filePath of entryPath) {
        manifest.content_scripts.push({
          matches: [], // get from entry in writeContentEntry
          js: [filePath],
        });
      }
    }
  }

  // if (isDevMode(mode) && manifest.content_scripts?.length) {
  //   const contentRuntime = resolve(selfRootPath, './static/content_runtime.js');
  //   manifest.content_scripts.unshift({
  //     js: [contentRuntime],
  //     matches: ['<all_urls>'],
  //   });
  // }
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
    const code = await getFileContent(rootPath, input);
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

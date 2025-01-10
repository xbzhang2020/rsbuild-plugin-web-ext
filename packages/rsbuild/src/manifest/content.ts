import { resolve } from 'node:path';
import { isDevMode } from './env.js';
import { parseExportObject } from './parser/export.js';
import type { ContentScriptConfig, ManifestEntryInput, ManifestEntryProcessor } from './types.js';
import { getFileContent, getMultipleEntryFiles, getSingleEntryFile } from './util.js';

const key = 'content';

const mergeContentEntry: ManifestEntryProcessor['merge'] = async ({ manifest, mode, selfRootPath, files, srcPath }) => {
  if (!manifest.content_scripts?.length) {
    const entryPath: string[] = [];
    const singleEntry = await getSingleEntryFile(srcPath, files, key);
    if (singleEntry) {
      entryPath.push(singleEntry);
    }
    const multipleEntry = await getMultipleEntryFiles(srcPath, files, 'contents');
    if (multipleEntry.length) {
      entryPath.push(...multipleEntry);
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

  // inject content runtime script for each entry in dev mode
  if (isDevMode(mode) && manifest.content_scripts?.length) {
    const contentLoadPath = resolve(selfRootPath, 'static/content_load.js');
    const contentBridgePath = resolve(selfRootPath, 'static/content_bridge.js');

    manifest.content_scripts.push({
      matches: ['<all_urls>'],
      js: [contentBridgePath],
    });

    manifest.content_scripts.forEach((item) => {
      item.js?.push(contentLoadPath);
    });
  }
};

const readContentEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { content_scripts } = manifest || {};
  if (!content_scripts?.length) return null;

  const entry: ManifestEntryInput = {};
  content_scripts.forEach((contentScript, index) => {
    const name = `content${content_scripts.length === 1 ? '' : index}`;
    const { js = [], css = [] } = contentScript;
    entry[name] = {
      input: [...js, ...css],
      html: false,
    };
  });
  return entry;
};

const writeContentEntry: ManifestEntryProcessor['write'] = async ({ manifest, rootPath, name, input, output }) => {
  const { content_scripts } = manifest;
  if (!content_scripts?.length || !output?.length) return;

  // normal content
  const index = Number(name.replace('content', '') || '0');
  if (!content_scripts[index]) return;

  const { matches } = content_scripts[index];
  if (!matches?.length && input?.[0]) {
    const code = await getFileContent(rootPath, resolve(rootPath, input[0]));
    const config = parseExportObject<ContentScriptConfig>(code, 'config') || {
      matches: ['<all_urls>'],
    };
    content_scripts[index] = {
      ...content_scripts[index],
      ...config,
    };
  }

  content_scripts[index].js = output.filter((item) => item.endsWith('.js'));
  content_scripts[index].css = output.filter((item) => item.endsWith('.css'));
};

const contentProcessor: ManifestEntryProcessor = {
  key,
  match: (entryName) => entryName.startsWith('content'),
  merge: mergeContentEntry,
  read: readContentEntry,
  write: writeContentEntry,
};

export default contentProcessor;

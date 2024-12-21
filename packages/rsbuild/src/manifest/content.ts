import { resolve } from 'node:path';
import type { Manifest } from 'webextension-polyfill';
import { parseExportObject } from './parser/export.js';
import type { ContentScriptConfig, ManifestEntry, ManifestEntryProcessor } from './types.js';
import { getFileContent, getMultipleEntryFiles, getSingleEntryFile, isDevMode } from './util.js';

const CONTENT_RUNTIME_NAME = 'content_runtime';
const CONTENT_RUNTIME_PATH = 'static/content_runtime.js';

const isRumtimeContentScript = (contentScript: Manifest.ContentScript) => {
  const { js = [] } = contentScript;
  return js.some((item) => item.endsWith(CONTENT_RUNTIME_PATH));
};

const mergeContentEntry: ManifestEntryProcessor['merge'] = async ({
  manifest,
  rootPath,
  srcDir,
  files,
  mode,
  selfRootPath,
}) => {
  // collect declarative content scripts
  if (!manifest.content_scripts?.length) {
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

  // inject content runtime script in dev mode
  if (isDevMode(mode) && manifest.content_scripts?.length) {
    manifest.content_scripts.push({
      js: [resolve(selfRootPath, CONTENT_RUNTIME_PATH)],
      matches: ['<all_urls>'],
    });
  }
};

const readContentEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { content_scripts } = manifest || {};
  if (!content_scripts?.length) return null;

  const entry: ManifestEntry = {};
  content_scripts.forEach((contentScript, index) => {
    const name = isRumtimeContentScript(contentScript)
      ? CONTENT_RUNTIME_NAME
      : `content${content_scripts.length === 1 ? '' : index}`;
    const { js = [], css = [] } = contentScript;
    entry[name] = {
      import: [...js, ...css],
      html: false,
    };
  });
  return entry;
};

const writeContentEntry: ManifestEntryProcessor['write'] = async ({ manifest, rootPath, assets, name }) => {
  const { content_scripts } = manifest;
  if (!content_scripts?.length || !assets) return;

  // runtime content
  if (name === CONTENT_RUNTIME_NAME) {
    const runtimeContentScript = content_scripts.find(isRumtimeContentScript);
    if (runtimeContentScript) {
      runtimeContentScript.js = assets.filter((item) => item.endsWith('.js'));
    }
    return;
  }

  // normal content
  const index = Number(name.replace('content', '') || '0');
  if (!content_scripts[index]) return;

  const { matches, js = [] } = content_scripts[index];
  const input = js[0] ? resolve(rootPath, js[0]) : null;
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

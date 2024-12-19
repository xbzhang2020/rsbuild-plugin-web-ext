import { resolve } from 'node:path';
import type { ManifestEntry, ManifestEntryProcessor, WebExtensionManifest } from './manifest.js';
import type { Manifest } from 'webextension-polyfill';
import { getSingleEntryFilePath, isDevMode } from './util.js';

const mergeBackgroundEntry: ManifestEntryProcessor['merge'] = async ({
  manifest,
  rootPath,
  srcDir,
  files,
  selfRootPath,
  target,
  mode,
}) => {
  const { background } = manifest;
  const scripts: string[] = [];

  if (background && 'service_worker' in background) {
    scripts.push(background.service_worker);
  } else if (background && 'scripts' in background && background.scripts) {
    scripts.push(...background.scripts);
  } else {
    const entryPath = await getSingleEntryFilePath(rootPath, srcDir, files, 'background');
    if (entryPath) {
      scripts.push(entryPath);
    }
  }

  if (isDevMode(mode)) {
    const defaultBackground = resolve(selfRootPath, './static/background.js');
    scripts.push(defaultBackground);
  }

  if (!scripts.length) return;

  manifest.background ??= {} as WebExtensionManifest['background'];
  // Firefox only supports background.scripts
  if (target.includes('firefox')) {
    (manifest.background as Manifest.WebExtensionManifestBackgroundC2Type).scripts = scripts;
  } else {
    (manifest.background as Manifest.WebExtensionManifestBackgroundC3Type).service_worker = scripts.join(',');
  }
};

const readBackgroundEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const { background } = manifest || {};
  if (!background) return null;

  let input: string[] = [];
  if ('service_worker' in background) {
    input = background.service_worker.split(',');
  } else if ('scripts' in background) {
    input = background.scripts || [];
  }

  if (!input.length) return null;
  const entry: ManifestEntry = {
    background: {
      import: input,
      html: false,
    },
  };
  return entry;
};

const writeBackgroundEntry: ManifestEntryProcessor['write'] = ({ manifest, assets }) => {
  const { background } = manifest;
  const output = assets?.filter((item) => item.endsWith('.js')) || [];
  if (!background || !output.length) return;
  if ('scripts' in background) {
    background.scripts = output;
  }
  if ('service_worker' in background) {
    background.service_worker = output[0];
  }
};

const backgroundProcessor: ManifestEntryProcessor = {
  key: 'background',
  match: (entryName) => entryName === 'background',
  merge: mergeBackgroundEntry,
  read: readBackgroundEntry,
  write: writeBackgroundEntry,
};

export default backgroundProcessor;

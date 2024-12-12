import { resolve } from 'node:path';
import type { ManifestEntry, ManifestEntryProcessor } from './manifest.js';

const mergeBackgroundEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath, selfRootPath, target }) => {
  const scripts: string[] = [];
  const { background } = manifest;

  if (background && 'service_worker' in background) {
    scripts.push(background.service_worker);
  } else if (background && 'scripts' in background && background.scripts) {
    scripts.push(...background.scripts);
  } else if (entryPath.length) {
    scripts.push(...entryPath);
  }

  if (process.env.NODE_ENV === 'development') {
    const defaultBackground = resolve(selfRootPath, './assets/background.js');
    scripts.push(defaultBackground);
  }

  if (scripts.length) {
    // Firefox only supports background.scripts
    const isFirefox = target.includes('firefox');
    if (isFirefox) {
      manifest.background = {
        ...(manifest.background || {}),
        scripts,
      };
    } else {
      manifest.background = {
        ...(manifest.background || {}),
        service_worker: scripts.join(','),
      };
    }
  }
};

const getBackgroundEntry: ManifestEntryProcessor['read'] = (manifest) => {
  let scripts: string[] = [];
  const { background } = manifest || {};
  if (background) {
    if ('service_worker' in background) {
      scripts = background.service_worker.split(',');
    } else if ('scripts' in background) {
      scripts = background.scripts || [];
    }
  }

  if (!scripts.length) return null;
  const entry: ManifestEntry = {
    background: {
      import: scripts,
      html: false,
    },
  };
  return entry;
};

const writeBackgroundEntry: ManifestEntryProcessor['write'] = ({ manifest, assets }) => {
  const { background } = manifest;
  if (!background || !assets?.length) return;

  if ('scripts' in background) {
    background.scripts = assets;
  }
  if ('service_worker' in background) {
    // assests only have one element.
    background.service_worker = assets[0];
  }
};

const backgroundProcessor: ManifestEntryProcessor = {
  key: 'background',
  match: (entryName) => entryName === 'background',
  merge: mergeBackgroundEntry,
  read: getBackgroundEntry,
  write: writeBackgroundEntry,
};

export default backgroundProcessor;

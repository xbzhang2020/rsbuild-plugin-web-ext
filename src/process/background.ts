import { resolve } from 'node:path';
import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest } from '../manifest.js';
import type { NormailzeMainfestEntryProps } from './process.js';

function hasBackgroundEntry(manifest: Manifest) {
  const background = manifest.background;
  if (background?.service_worker || background?.scripts?.length) return true;
  return false;
}

export function mergeBackgroundEntry({ manifest, entryPath, selfRootPath }: NormailzeMainfestEntryProps) {
  if (entryPath && !hasBackgroundEntry(manifest)) {
    manifest.background = {
      service_worker: entryPath as string,
    };
  }

  if (process.env.NODE_ENV === 'development') {
    const defaultBackground = resolve(selfRootPath, './assets/background-runtime.js');
    const { background } = manifest;
    if (background?.service_worker) {
      background.service_worker = [defaultBackground, background.service_worker].join(',');
    } else if (background?.scripts?.length) {
      background.scripts.unshift(defaultBackground);
    } else {
      manifest.background = {
        service_worker: defaultBackground,
      };
    }
  }
}

export function getBackgroundEntry(manifest: Manifest) {
  const scripts: string[] = [];
  const { background } = manifest;
  if (background?.service_worker) {
    scripts.push(...background.service_worker.split(','));
  } else if (background?.scripts?.length) {
    scripts.push(...background.scripts);
  }

  const entry: RsbuildEntry = {};
  if (scripts.length) {
    entry.background = {
      import: scripts,
      html: false,
    };
  }
  return entry;
}

export function writeBackgroundEntry(manifest: Manifest, key: string, assets: string[]) {
  if (!manifest.background) return;
  if (manifest.background.scripts) {
    manifest.background.scripts = assets;
  }
  manifest.background.service_worker = assets[0];
}

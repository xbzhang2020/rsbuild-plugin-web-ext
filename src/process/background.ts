import type { ManifestV3 } from '../manifest.js';
import type { NormailzeMainfestEntryProps } from './process.js';
import type { RsbuildEntry } from '@rsbuild/core';
import { resolve } from 'node:path';

export function mergeBackgroundEntry({ manifest, entryPath, selfRootPath }: NormailzeMainfestEntryProps) {
  const scripts: string[] = [];

  if (process.env.NODE_ENV === 'development') {
    const defaultBackground = resolve(selfRootPath, './assets/default-background.js');
    scripts.push(defaultBackground);
  }

  const { background } = manifest;
  if (background?.service_worker) {
    scripts.push(background.service_worker);
  } else if (background?.scripts?.length) {
    scripts.push(...background.scripts);
  } else {
    scripts.push(entryPath);
  }

  manifest.background = {
    service_worker: scripts.length === 1 ? scripts[0] : '',
    scripts,
  };
}

export function getBackgroundEntry(manifest: ManifestV3) {
  const scripts = manifest.background?.service_worker || manifest.background?.scripts;
  const entry: RsbuildEntry = {};

  if (scripts) {
    entry.background = {
      import: scripts,
      html: false,
    };
  }
  return entry;
}

export function writeBackgroundEntry(manifest: ManifestV3, key: string, assets: string[]) {
  if (!manifest.background) return;
  if (manifest.background.scripts) {
    manifest.background.scripts = assets;
  }
  manifest.background.service_worker = assets[0];
}

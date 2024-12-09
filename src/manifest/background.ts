import { resolve } from 'node:path';
import type { RsbuildEntry } from '@rsbuild/core';
import type { Manifest, NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './manifest.js';

export function mergeBackgroundEntry({ manifest, entryPath, selfRootPath, target }: NormalizeMainfestEntryProps) {
  const scripts: string[] = [];
  const { background } = manifest;

  if (background && 'service_worker' in background) {
    scripts.push(background.service_worker);
  } else if (background && 'scripts' in background && background.scripts) {
    scripts.push(...background.scripts);
  } else if (entryPath) {
    scripts.push(entryPath as string);
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
}

export function getBackgroundEntry(manifest: Manifest) {
  let scripts: string[] = [];
  const { background } = manifest;
  if (background) {
    if ('service_worker' in background) {
      scripts = background.service_worker.split(',');
    } else if ('scripts' in background) {
      scripts = background.scripts || [];
    }
  }

  if (!scripts.length) return null;
  const entry: RsbuildEntry = {
    background: {
      import: scripts,
      html: false,
    },
  };
  return entry;
}

export function writeBackgroundEntry({ manifest, assets }: WriteMainfestEntryProps) {
  const { background } = manifest;
  if (!background) return;
  if ('scripts' in background) {
    background.scripts = assets;
  }
  if ('service_worker' in background) {
    // assests only have one element.
    background.service_worker = assets[0];
  }
}

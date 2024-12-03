import type { RsbuildEntry } from '@rsbuild/core';
import type { ManifestV3 } from '../manifest.js';

export function mergeBackgroundEntry(manifest: ManifestV3, rootPath: string, filePath: string) {
  if (manifest.background?.service_worker || manifest.background?.scripts?.length) return;
  manifest.background = {
    service_worker: filePath,
  };
}

export function getBackgroundEntry(manifest: ManifestV3) {
  const service_worker = manifest.background?.service_worker || manifest.background?.scripts;
  const entry: Record<string, string | string[]> = {};

  if (service_worker) {
    entry.background = service_worker;
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

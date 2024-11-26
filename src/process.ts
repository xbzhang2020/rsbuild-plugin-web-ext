import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildEntry, Rspack } from '@rsbuild/core';
import type { ManifestV3 } from '../types/index.js';

export function collectEntries(myManifest: ManifestV3): RsbuildEntry {
  const entryMap: Record<string, string | string[]> = {};

  // background
  const service_worker = myManifest.background?.service_worker || myManifest.background?.scripts;
  if (service_worker) {
    entryMap.background = service_worker;
  }

  // content_scripts
  const contentScripts = myManifest.content_scripts;
  contentScripts?.forEach((contentScript, index) => {
    const name = `content${index === 0 ? '' : index}`;
    const { js = [], css = [] } = contentScript;
    entryMap[name] = [...js, ...css];
  });

  // popup
  const popup = myManifest.action?.default_popup;
  if (popup) {
    entryMap.popup = popup;
  }

  const res: RsbuildEntry = {};
  for (const [key, value] of Object.entries(entryMap)) {
    res[key] = {
      import: value,
      html: key === 'popup',
    };
  }
  return res;
}

export function modifyManifestEntries(myManifest: ManifestV3, stats?: Rspack.Stats): ManifestV3 {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return myManifest;

  for (const [key, entrypoint] of Object.entries(entrypoints)) {
    const assets = entrypoint.assets?.map((item) => item.name);
    console.log('assets', assets);

    if (!assets) continue;

    if (key === 'background' && myManifest.background) {
      if (myManifest.background?.scripts) {
        myManifest.background.scripts = assets;
      }
      myManifest.background.service_worker = assets[0];
    }

    if (key.startsWith('content') && myManifest.content_scripts) {
      const index = Number(key.replace('content', '') || '0');
      myManifest.content_scripts[index].js = assets.filter(
        (item) => item.endsWith('.js') && !item.includes('.hot-update.'),
      );
      myManifest.content_scripts[index].css = assets.filter((item) => item.endsWith('.css'));
    }

    if (key === 'popup' && myManifest.action) {
      myManifest.action.default_popup = `${entrypoint.name}.html`;
    }
  }
  return myManifest;
}

export async function processManifestIcons(myManifest: ManifestV3, distPath: string) {
  const icons = [...Object.values(myManifest.icons || {}), ...Object.values(myManifest.action?.default_icon || {})];
  for await (const icon of icons) {
    await cp(icon, resolve(distPath, icon));
  }
}

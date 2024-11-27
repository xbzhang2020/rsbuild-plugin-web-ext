import type { RsbuildEntry, Rspack } from '@rsbuild/core';
import type { ManifestV3 } from '../types/index.js';

export function collectEntries(myManifest: ManifestV3): RsbuildEntry {
  const entryMap: Record<string, string | string[]> = {};

  const service_worker = myManifest.background?.service_worker || myManifest.background?.scripts;
  if (service_worker) {
    entryMap.background = service_worker;
  }

  const contentScripts = myManifest.content_scripts;
  contentScripts?.forEach((contentScript, index) => {
    const name = `content${index === 0 ? '' : index}`;
    const { js = [], css = [] } = contentScript;
    entryMap[name] = [...js, ...css];
  });

  const popup = myManifest.action?.default_popup;
  if (popup) {
    entryMap.popup = popup;
  }

  const options = myManifest.options_ui?.page || myManifest.options_page;
  if (options) {
    entryMap.options = options;
  }

  const devtools = myManifest.devtools_page;
  if (devtools) {
    entryMap.devtools = devtools;
  }

  const res: RsbuildEntry = {};
  for (const [key, value] of Object.entries(entryMap)) {
    res[key] = {
      import: value,
      html: ['popup', 'options', 'devtools'].includes(key),
    };
  }
  return res;
}

export function modifyManifestEntries(myManifest: ManifestV3, stats?: Rspack.Stats): ManifestV3 {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  const assets = stats?.toJson().assets;

  if (!entrypoints) return myManifest;

  for (const [key, entrypoint] of Object.entries(entrypoints)) {
    const assets = entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.'));

    if (!assets) continue;

    if (key === 'background' && myManifest.background) {
      if (myManifest.background.scripts) {
        myManifest.background.scripts = assets;
      }
      myManifest.background.service_worker = assets[0];
    }

    if (key.startsWith('content') && myManifest.content_scripts) {
      const index = Number(key.replace('content', '') || '0');
      myManifest.content_scripts[index].js = assets.filter((item) => item.endsWith('.js'));
      myManifest.content_scripts[index].css = assets.filter((item) => item.endsWith('.css'));
    }

    if (key === 'popup' && myManifest.action) {
      myManifest.action.default_popup = `${entrypoint.name}.html`;
    }

    if (key === 'options') {
      const filename = `${entrypoint.name}.html`;
      if (myManifest.options_page) {
        myManifest.options_page = filename;
      }
      if (myManifest.options_ui) {
        myManifest.options_ui.page = filename;
      }
    }

    if (key === 'devtools') {
      myManifest.devtools_page = `${entrypoint.name}.html`;
    }
  }
  return myManifest;
}

export function processManifestIcons(myManifest: ManifestV3, distImagePath: string) {
  const paths: { from: string; to: string }[] = [];

  function helper(icons?: Record<number, string>) {
    if (!icons) return;
    for (const key in icons) {
      const from = icons[key];
      const filename = from.split('/').at(-1);
      if (filename) {
        const newFilename = `${distImagePath}/${filename}`;
        icons[key] = newFilename;
      }
      paths.push({
        from,
        to: distImagePath,
      });
    }
  }

  const { icons, action } = myManifest;
  if (icons) {
    helper(icons);
  }
  if (action?.default_icon) {
    helper(action.default_icon);
  }

  return paths;
}

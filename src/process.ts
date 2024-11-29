import type { RsbuildEntry, Rspack } from '@rsbuild/core';
import type { ManifestV3 } from './manifest.js';

export function collectManifestEntries(myManifest: ManifestV3): RsbuildEntry {
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

  const sandboxPages = myManifest.sandbox?.pages;
  sandboxPages?.forEach((page, index) => {
    const name = `sandbox${index === 0 ? '' : index}`;
    entryMap[name] = page;
  });

  const res: RsbuildEntry = {};
  for (const [key, value] of Object.entries(entryMap)) {
    res[key] = {
      import: value,
      html: ['popup', 'options', 'devtools'].includes(key) || key.startsWith('sandbox'),
    };
  }
  return res;
}

export function modifyManifestEntries(myManifest: ManifestV3, stats?: Rspack.Stats) {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return myManifest;

  Object.entries(entrypoints).forEach(([key, entrypoint]) => {
    const assets = entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.'));
    if (!assets) return;

    if (key === 'background') {
      if (!myManifest.background) return;
      if (myManifest.background.scripts) {
        myManifest.background.scripts = assets;
      }
      myManifest.background.service_worker = assets[0];
      return;
    }

    if (key.startsWith('content')) {
      if (!myManifest.content_scripts) return;
      const index = Number(key.replace('content', '') || '0');
      myManifest.content_scripts[index].js = assets.filter((item) => item.endsWith('.js'));
      myManifest.content_scripts[index].css = assets.filter((item) => item.endsWith('.css'));
      return;
    }

    if (key === 'popup') {
      if (!myManifest.action) return;
      myManifest.action.default_popup = `${entrypoint.name}.html`;
      return;
    }

    if (key === 'options') {
      const filename = `${entrypoint.name}.html`;
      if (myManifest.options_page) {
        myManifest.options_page = filename;
      }
      if (myManifest.options_ui) {
        myManifest.options_ui.page = filename;
      }
      return;
    }

    if (key === 'devtools') {
      myManifest.devtools_page = `${entrypoint.name}.html`;
      return;
    }

    if (key.startsWith('sandbox')) {
      if (!myManifest.sandbox?.pages) return;
      const index = Number(key.replace('content', '') || '0');
      myManifest.sandbox.pages[index] = `${entrypoint.name}.html`;
    }
  });
}

export function processManifestIcons(myManifest: ManifestV3, distImagePath: string) {
  const paths: { from: string; to: string }[] = [];

  function helper(icons?: Record<number, string>) {
    if (!icons) return;
    for (const key in icons) {
      const from = icons[key];
      const filename = from.split('/').at(-1);
      if (filename) {
        icons[key] = `${distImagePath}/${filename}`;
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

export function processManifestWebAccessibleResources(myManifest: ManifestV3) {
  const { web_accessible_resources } = myManifest;
  if (!web_accessible_resources) return [];

  const resources: string[] = [];
  for (const item of web_accessible_resources) {
    resources.push(...item.resources);
  }

  return resources.map((item) => ({
    from: item,
    to: item.includes('*') ? undefined : item,
  }));
}

export function processManifestLocales(myManifest: ManifestV3) {
  const { default_locale } = myManifest;
  if (!default_locale) return [];
  return [{ from: './_locales', to: '_locales' }];
}

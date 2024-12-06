import type { Manifest } from '../manifest.js';
import type { NormalizeMainfestEntryProps } from './process.js';

export function mergeIconsEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  if (!entryPath) return;
  const assetsIcons: Manifest['icons'] = {};
  const filePaths = entryPath as string[];

  for (const filePath of filePaths) {
    const res = filePath.match(/icon-?(\d+)\.png$/);
    if (res?.[1]) {
      const size = Number(res[1]);
      assetsIcons[size] = filePath;
    }
  }

  if (!Object.keys(assetsIcons).length) return;
  manifest.icons = {
    ...assetsIcons,
    ...(manifest.icons || {}),
  };

  const { manifest_version, action, browser_action } = manifest;
  if (manifest_version === 2) {
    if (!browser_action) {
      manifest.browser_action = {};
    }
  } else {
    if (!action) {
      manifest.action = {};
    }
  }

  const actionPointer = manifest_version === 2 ? browser_action : action;
  if (actionPointer) {
    if (typeof actionPointer.default_icon === 'string') return;
    actionPointer.default_icon = {
      ...assetsIcons,
      ...(actionPointer.default_icon || {}),
    };
  }
}

export function copyIcons(manifest: Manifest, distImagePath: string) {
  const paths: { from: string; to: string }[] = [];

  function helper(icons?: Record<number, string> | string) {
    if (!icons) return;
    const noramlIcons = typeof icons === 'string' ? { 16: icons } : icons;
    
    for (const key in noramlIcons) {
      const from = icons[key];
      const filename = from.split('/').at(-1);
      if (filename) {
        noramlIcons[key] = `${distImagePath}/${filename}`;
      }
      paths.push({
        from,
        to: distImagePath,
      });
    }
  }

  const { icons, action, browser_action, manifest_version } = manifest;
  if (icons) {
    helper(icons);
  }

  if (manifest_version === 2) {
    helper(browser_action?.default_icon);
  } else {
    helper(action?.default_icon);
  }

  return paths;
}

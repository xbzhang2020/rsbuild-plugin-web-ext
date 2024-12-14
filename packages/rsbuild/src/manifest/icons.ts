import { getFileName } from '../util.js';
import type { Manifest, ManifestEntryProcessor } from './manifest.js';

export const iconSizeList = [16, 32, 48, 64, 128];
export const derivedImage = 'icon.png';

export const getIconSize = (filePath: string) => {
  const res = filePath.match(/icon-?(\d+)\.png$/);
  if (res?.[1]) return Number(res[1]);
  return null;
};

export const mergeIconsEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  const declarativeIcons: Manifest['icons'] = {};
  for (const filePath of entryPath) {
    const size = getIconSize(filePath);
    if (size) {
      declarativeIcons[size] = filePath;
    }
  }
  if (!Object.keys(declarativeIcons).length) return;

  manifest.icons = {
    ...declarativeIcons,
    ...(manifest.icons || {}),
  };

  const { manifest_version } = manifest;
  let actionPointer: Manifest['action'] = undefined;
  if (manifest_version === 2) {
    manifest.browser_action ??= {};
    actionPointer = manifest.browser_action;
  } else {
    manifest.action ??= {};
    actionPointer = manifest.action;
  }
  if (typeof actionPointer.default_icon === 'string') {
    actionPointer.default_icon = {
      16: actionPointer.default_icon,
    };
  }
  actionPointer.default_icon = {
    ...declarativeIcons,
    ...(actionPointer.default_icon || {}),
  };
};

export const getIconsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const paths = new Set<string>();
  function helper(icons?: Manifest['icons'] | string) {
    if (!icons) return;
    if (typeof icons === 'string') {
      paths.add(icons);
      return;
    }
    for (const key in icons) {
      paths.add(icons[key]);
    }
  }

  const { icons, action, browser_action, manifest_version } = manifest || {};
  if (icons) {
    helper(icons);
  }
  if (manifest_version === 2) {
    helper(browser_action?.default_icon);
  } else {
    helper(action?.default_icon);
  }

  if (paths.size === 0) return null;
  return {
    icons: {
      import: Array.from(paths),
      html: false,
    },
  };
};

const writeIconsEntry: ManifestEntryProcessor['write'] = ({ manifest, assets }) => {
  const iconAssets = assets?.filter((item) => item.endsWith('.png')) || [];

  function helper(icons?: Manifest['icons']) {
    if (!icons) return;
    for (const key in icons) {
      const name = getFileName(icons[key]) || '';
      const res = iconAssets.find((item) => item.endsWith(name) || getIconSize(item) === Number(key));
      if (res) {
        icons[key] = res;
      }
    }
  }

  const { icons, action, browser_action, manifest_version } = manifest || {};
  if (icons) {
    helper(icons);
  }

  const actionPointer = manifest_version === 2 ? browser_action : action;
  if (actionPointer) {
    const { default_icon } = actionPointer;
    if (typeof default_icon === 'string') {
      const name = getFileName(default_icon) || '';
      const res = iconAssets.find((item) => item.endsWith(name)) || undefined;
      actionPointer.default_icon = res;
      return;
    }
    helper(actionPointer.default_icon);
  }
};

const iconsProcessor: ManifestEntryProcessor = {
  key: 'icons',
  match: (entryName) => entryName === 'assets' || entryName === 'icons',
  merge: mergeIconsEntry,
  read: getIconsEntry,
  write: writeIconsEntry,
};

export default iconsProcessor;

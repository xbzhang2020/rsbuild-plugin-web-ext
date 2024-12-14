import { getFileName } from '../util.js';
import type { Manifest, ManifestEntry, ManifestEntryProcessor, ManifestV3 } from './manifest.js';

// const iconSizeList = [16, 32, 48, 64, 128];
// const derivedImage = 'icon.png';

const getIconSize = (filePath: string) => {
  const res = filePath.match(/icon-?(\d+)\.png$/);
  if (res?.[1]) return Number(res[1]);
  return null;
};

const getDerivedIcons = (entryPath: string[]) => {
  const declarativeIcons: Manifest['icons'] = {};
  for (const filePath of entryPath) {
    const size = getIconSize(filePath);
    if (size) {
      declarativeIcons[size] = filePath;
    }
  }
  return !Object.keys(declarativeIcons).length ? null : declarativeIcons;
};

const mergeIconsEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  const declarativeIcons = getDerivedIcons(entryPath);
  if (!declarativeIcons) return;

  manifest.icons = {
    ...declarativeIcons,
    ...(manifest.icons || {}),
  };

  const { manifest_version } = manifest;
  let pointer: ManifestV3['action'] = undefined;
  if (manifest_version === 2) {
    manifest.browser_action ??= {};
    pointer = manifest.browser_action;
  } else {
    manifest.action ??= {};
    pointer = manifest.action;
  }
  if (typeof pointer.default_icon === 'string') {
    pointer.default_icon = {
      16: pointer.default_icon,
    };
  }
  pointer.default_icon = {
    ...declarativeIcons,
    ...(pointer.default_icon || {}),
  };
};

const readIconsEntry: ManifestEntryProcessor['read'] = (manifest) => {
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
  const entry: ManifestEntry = {
    icons: {
      import: Array.from(paths),
      html: false,
    },
  };
  return entry;
};

const writeIconsEntry: ManifestEntryProcessor['write'] = ({ manifest, assets }) => {
  const iconAssets = assets?.filter((item) => item.endsWith('.png')) || [];
  if (!iconAssets.length) return;

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

  const pointer = manifest_version === 2 ? browser_action : action;
  if (!pointer) return;
  const { default_icon } = pointer;
  if (typeof default_icon === 'string') {
    const name = getFileName(default_icon) || '';
    pointer.default_icon = iconAssets.find((item) => item.endsWith(name)) || undefined;
    return;
  }
  helper(pointer.default_icon);
};

const iconsProcessor: ManifestEntryProcessor = {
  key: 'icons',
  match: (entryName) => entryName === 'assets' || entryName === 'icons',
  merge: mergeIconsEntry,
  read: readIconsEntry,
  write: writeIconsEntry,
};

export default iconsProcessor;

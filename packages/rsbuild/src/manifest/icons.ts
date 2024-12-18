import type { Manifest, ManifestEntry, ManifestEntryProcessor, ManifestV3 } from './manifest.js';
import { getAssetPaths, getFileName } from './util.js';

const getIconSize = (filePath: string) => {
  const match = filePath.match(/icon-?(\d+)\.png$/);
  return match ? Number(match[1]) : null;
};

const getDeclarativeIcons = (entryPath: string[]) => {
  const declarativeIcons: Manifest['icons'] = {};
  for (const filePath of entryPath) {
    const size = getIconSize(filePath);
    if (size) {
      declarativeIcons[size] = filePath;
    }
  }
  return Object.keys(declarativeIcons).length ? declarativeIcons : null;
};

const getIconAsset = (assets: string[], input: string | undefined, size: number) => {
  const name = input ? getFileName(input) : undefined;
  return assets.find((item) => (name && item.endsWith(name)) || getIconSize(item) === size);
};

const mergeIconsEntry: ManifestEntryProcessor['merge'] = async ({ manifest, files, srcPath }) => {
  const entryPath = await getAssetPaths(srcPath, files, (asset) => asset.endsWith('.png'));
  if (!entryPath.length) return;

  const declarativeIcons = getDeclarativeIcons(entryPath);
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
  const pointer = manifest_version === 2 ? browser_action : action;
  helper(icons);
  helper(pointer?.default_icon);

  if (paths.size === 0) return null;
  const entry: ManifestEntry = {
    icons: {
      import: Array.from(paths),
      html: false,
    },
  };
  return entry;
};

const writeIconsEntry: ManifestEntryProcessor['write'] = ({ manifest, assets = [] }) => {
  function helper(icons?: Manifest['icons']) {
    if (typeof icons !== 'object') return;
    for (const key in icons) {
      const size = Number(key);
      const output = getIconAsset(assets, icons[key], size);
      if (output) {
        icons[size] = output;
      }
    }
  }

  const { icons, action, browser_action, manifest_version } = manifest;
  helper(icons);

  const pointer = manifest_version === 2 ? browser_action : action;
  if (typeof pointer?.default_icon === 'string') {
    pointer.default_icon = getIconAsset(assets, pointer.default_icon, 16);
  } else {
    helper(pointer?.default_icon);
  }
};

const iconsProcessor: ManifestEntryProcessor = {
  key: 'icons',
  match: (entryName) => entryName === 'icons',
  merge: mergeIconsEntry,
  read: readIconsEntry,
  write: writeIconsEntry,
};

export default iconsProcessor;

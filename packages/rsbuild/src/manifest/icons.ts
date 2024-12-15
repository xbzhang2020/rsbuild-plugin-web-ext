import type { Rspack } from '@rsbuild/core';
import sharp from 'sharp';
import { getFileName } from '../util.js';
import type { Manifest, ManifestEntry, ManifestEntryProcessor, ManifestV3 } from './manifest.js';

const ICON_SIZES = [16, 32, 48, 64, 128, 512];
const DERIVED_IMAGE = 'icon.png';

const getIconSize = (filePath: string) => {
  const res = filePath.match(/icon-?(\d+)\.png$/);
  if (res?.[1]) return Number(res[1]);
  if (filePath.endsWith(DERIVED_IMAGE)) return -1;
  return null;
};

const getDeclarativeIcons = (entryPath: string[]) => {
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

const getIconAsset = (assets: string[], input: string, size: number) => {
  const name = getFileName(input) || '';
  return assets.find((item) => item.endsWith(name) || getIconSize(item) === size);
};

export const processIcons = async (manifest: Manifest, assets: Record<string, Rspack.sources.Source>) => {
  const { icons = {}, action, browser_action, manifest_version } = manifest;
  const assetsNames = Object.keys(assets);

  const deriverImage = getIconAsset(assetsNames, icons[-1] || '', -1) || '';
  let deleteDeriverImage = true;
  const needDerivedIcons = new Map<number, string>();

  function helper(icons: Manifest['icons']) {
    if (typeof icons !== 'object') return;
    const sizes = Object.keys(icons).map(Number);
    const needDerivedSizes = ICON_SIZES.filter((item) => !sizes.includes(item));

    for (const key of sizes) {
      const size = Number(key);
      if (size === -1) {
        delete icons[key];
        for (const newSize of needDerivedSizes) {
          const newName = deriverImage.replace(DERIVED_IMAGE, `icon-${newSize}.png`);
          icons[newSize] = newName;
          needDerivedIcons.set(newSize, newName);
        }
      } else {
        if (icons[key].endsWith(DERIVED_IMAGE)) {
          deleteDeriverImage = false;
        }
        const iconAsset = getIconAsset(assetsNames, icons[key], size);
        if (iconAsset) {
          icons[key] = iconAsset;
        } else {
          delete icons[key];
        }
      }
    }
  }

  helper(icons);

  const pointer = manifest_version === 2 ? browser_action : action;
  if (typeof pointer?.default_icon === 'string') {
    pointer.default_icon = getIconAsset(assetsNames, pointer.default_icon, 16);
  } else {
    helper(pointer?.default_icon);
  }

  const deleteAssets = assetsNames.filter((name) => {
    if (name.endsWith('.js')) return true;
    if (deleteDeriverImage && name.endsWith(DERIVED_IMAGE)) return true;
    return false;
  });

  const emitAssets: Array<{ name: string; buffer: Buffer }> = [];
  for (const [size, name] of needDerivedIcons) {
    const input = assets[deriverImage].buffer();
    const buffer = await sharp(input).resize(size, size).toBuffer();
    emitAssets.push({ name, buffer });
  }

  return { emitAssets, deleteAssets };
};

// completed in processIcons
const writeIconsEntry: ManifestEntryProcessor['write'] = () => {};

const iconsProcessor: ManifestEntryProcessor = {
  key: 'icons',
  match: (entryName) => entryName === 'assets' || entryName === 'icons',
  merge: mergeIconsEntry,
  read: readIconsEntry,
  write: writeIconsEntry,
};

export default iconsProcessor;

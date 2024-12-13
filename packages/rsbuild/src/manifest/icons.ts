import type { Manifest, ManifestEntryProcessor } from './manifest.js';

export const iconSizeList = [16, 32, 48, 64, 128];

export const getIconSize = (filePath: string) => {
  const res = filePath.match(/icon-?(\d+)\.png$/);
  if (res?.[1]) return Number(res[1]);
  return null;
};

export const mergeIconsEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
  const assetsIcons: Manifest['icons'] = {};

  for (const filePath of entryPath) {
    const size = getIconSize(filePath);
    if (size) {
      assetsIcons[size] = filePath;
    }
  }

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
  if (!actionPointer) return;

  if (typeof actionPointer.default_icon === 'string') {
    actionPointer.default_icon = {
      16: actionPointer.default_icon,
    };
  }

  actionPointer.default_icon = {
    ...assetsIcons,
    ...(actionPointer.default_icon || {}),
  };
};

export const getIconsEntry: ManifestEntryProcessor['read'] = (manifest) => {
  const paths: string[] = [];

  function helper(icons?: Record<number, string> | string) {
    if (!icons) return;
    const noramlIcons = typeof icons === 'string' ? { 16: icons } : icons;

    for (const key in noramlIcons) {
      const from = `${icons[key]}`;
      // const filename = from.split('/').at(-1);
      paths.push(from);
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

  if (!paths.length) return null;

  return {
    icons: {
      import: paths,
      html: false,
    },
  };
};

const writeIconsEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName, assets, auxiliaryAssets }) => {
  const iconAssets = auxiliaryAssets?.filter((item) => item.endsWith('.png')) || [];
  const iconAssetsMap = iconAssets.reduce(
    (res, cur) => {
      const size = getIconSize(cur);
      if (size) {
        res[size] = cur;
      }
      return res;
    },
    {} as Record<string, string>,
  );

  function helper(icons?: Record<number, string | undefined>) {
    if (!icons || typeof icons !== 'object') return;

    for (const key in icons) {
      icons[key] = iconAssetsMap[key] || undefined;
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
};

const iconsProcessor: ManifestEntryProcessor = {
  key: 'icons',
  match: (entryName) => entryName === 'assets' || entryName.startsWith('icons'),
  merge: mergeIconsEntry,
  read: getIconsEntry,
  write: writeIconsEntry,
};

export default iconsProcessor;

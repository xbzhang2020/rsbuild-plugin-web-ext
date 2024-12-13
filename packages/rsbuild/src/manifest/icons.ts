import type { Manifest, ManifestEntryProcessor } from './manifest.js';

export const mergeIconsEntry: ManifestEntryProcessor['merge'] = ({ manifest, entryPath }) => {
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

const writeIconsEntry: ManifestEntryProcessor['write'] = ({ manifest, entryName }) => {
  // TODO: 待完善
  // manifest.icons = `${entryName}.png`;
  console.log(manifest, entryName);
};

const iconsProcessor: ManifestEntryProcessor = {
  key: 'icons',
  match: (entryName) => entryName === 'assets' || entryName.startsWith('icons'),
  merge: mergeIconsEntry,
  read: getIconsEntry,
  write: writeIconsEntry,
};

export default iconsProcessor;

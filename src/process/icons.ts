import type { ManifestV3 } from '../manifest.js';

export function mergeIconsEntry(manifest: ManifestV3, rootPath: string, filePaths: string[]) {
  const assetsIcons: ManifestV3['icons'] = {};
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

  if (!manifest.action) {
    manifest.action = {};
  }
  manifest.action.default_icon = {
    ...assetsIcons,
    ...(manifest.action.default_icon || {}),
  };
}

export function copyIcons(manifest: ManifestV3, distImagePath: string) {
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

  const { icons, action } = manifest;
  if (icons) {
    helper(icons);
  }
  if (action?.default_icon) {
    helper(action.default_icon);
  }
  return paths;
}

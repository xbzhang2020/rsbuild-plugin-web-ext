import type { ManifestV3 } from '../manifest.js';

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

import type { ManifestV3 } from '../manifest.js';

export function copyWebAccessibleResources(manifest: ManifestV3) {
  const { web_accessible_resources } = manifest;
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
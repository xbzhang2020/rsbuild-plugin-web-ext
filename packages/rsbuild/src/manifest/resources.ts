import type { Manifest } from './manifest.js';

export function copyWebAccessibleResources(manifest: Manifest) {
  const { web_accessible_resources } = manifest;
  if (!web_accessible_resources) return [];

  const resources: string[] = [];
  for (const item of web_accessible_resources) {
    // web_accessible_resources key is an array of string in Manifest V2
    if (typeof item === 'string') {
      resources.push(...item);
    } else {
      resources.push(...item.resources);
    }
  }

  return resources.map((item) => ({
    from: item,
    to: item.includes('*') ? undefined : item,
  }));
}

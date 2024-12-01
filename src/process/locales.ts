import type { ManifestV3 } from '../manifest.js';

export function copyLocales(manifest: ManifestV3) {
  const { default_locale } = manifest;
  if (!default_locale) return [];
  return [{ from: './_locales', to: '_locales' }];
}

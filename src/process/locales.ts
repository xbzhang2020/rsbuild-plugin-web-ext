import type { Manifest } from '../manifest.js';

export function copyLocales(manifest: Manifest) {
  const { default_locale } = manifest;
  if (!default_locale) return [];
  return [{ from: './_locales', to: '_locales' }];
}

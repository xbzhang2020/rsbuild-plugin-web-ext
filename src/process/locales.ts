import type { Manifest } from '../manifest.js';
import { resolve } from 'node:path';

export function copyLocales(manifest: Manifest, srcPath = './') {
  const { default_locale } = manifest;
  if (!default_locale) return [];
  return [{ from: resolve(srcPath, '_locales'), to: '_locales' }];
}

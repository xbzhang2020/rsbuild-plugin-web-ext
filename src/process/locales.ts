import { resolve } from 'node:path';
import type { Manifest } from '../manifest.js';

export function copyLocales(manifest: Manifest, srcPath = './') {
  const { default_locale } = manifest;
  if (!default_locale) return [];
  return [{ from: resolve(srcPath, '_locales'), to: '_locales' }];
}

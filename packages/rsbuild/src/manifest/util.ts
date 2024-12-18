import type { BuildMode } from './manifest.js';

export function isDevMode(mode?: BuildMode) {
  if (mode) return mode === 'development';
  return process.env.NODE_ENV === 'development';
}

import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { ExtensionTarget } from './types.js';

export function isDevMode(mode?: string) {
  return mode === 'development';
}

export function isProdMode(mode?: string) {
  return mode === 'production';
}

const EXTENSION_TARGETS: ExtensionTarget[] = [
  'chrome-mv3',
  'firefox-mv3',
  'firefox-mv2',
  'safari-mv3',
  'edge-mv3',
  'opera-mv3',
];
const DEFAULT_TARGET: ExtensionTarget = 'chrome-mv3';

export const getExtensionTarget = (target?: string): ExtensionTarget => {
  const envTarget = process.env.WEB_EXTEND_TARGET as ExtensionTarget;
  if (envTarget && EXTENSION_TARGETS.includes(envTarget)) {
    return envTarget;
  }

  const optionTarget = target as ExtensionTarget;
  if (optionTarget && EXTENSION_TARGETS.includes(optionTarget)) {
    return optionTarget;
  }
  return DEFAULT_TARGET;
};

export const getSrcDir = (rootPath: string, srcDir: string | undefined) => {
  if (srcDir) return srcDir;
  return existsSync(resolve(rootPath, './src/')) ? './src' : './';
};

export function getOutputDir(distPath: string | undefined, target: ExtensionTarget, mode: string | undefined) {
  const tag = isDevMode(mode) ? 'dev' : isProdMode(mode) ? 'prod' : mode || '';
  const dir = distPath || 'dist';
  const subDir = [target || DEFAULT_TARGET, tag].filter(Boolean).join('-');
  return join(dir, subDir);
}

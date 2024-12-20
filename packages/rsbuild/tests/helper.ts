import { existsSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { pluginWebExt } from '../src/index.js';
import type { PluginWebExtOptions } from '../src/index.js';

export { readManifestFile } from '../src/manifest/index.js';

export function getFileContent(distPath: string, name: string) {
  return readFile(resolve(distPath, name), 'utf-8');
}

export function existsFile(distPath: string, name: string, ext: string) {
  if (!name) return false;
  return existsSync(resolve(distPath, name)) && extname(name) === ext;
}

type InitRsbuildOptions = {
  cwd: string;
  mode: 'development' | 'production';
  pluginOptions?: Partial<PluginWebExtOptions>;
};

export async function initRsbuild({ cwd, mode, pluginOptions }: InitRsbuildOptions) {
  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig: {
      mode,
      plugins: [pluginWebExt(pluginOptions)],
    },
  });
  return rsbuild;
}

export async function clearDist(distPath: string) {
  await rm(distPath, { recursive: true, force: true });
}

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { pluginWebExt } from '../src/index.js';

function getFileExt(path: string) {
  return path.split('.').pop();
}

export function existsFile(distPath: string, name: string, ext: string) {
  if (!name) return false;
  return existsSync(resolve(distPath, name)) && getFileExt(name) === ext;
}

type InitRsbuildOptions = {
  cwd: string;
  mode: 'development' | 'production';
  outDir?: string;
};

export async function initRsbuild({ cwd, mode, outDir = 'dist' }: InitRsbuildOptions) {
  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig: {
      mode,
      plugins: [pluginWebExt()],
      output: {
        distPath: {
          root: outDir,
        },
        sourceMap: false,
      },
    },
  });
  return rsbuild;
}

export async function readManifest(distPath: string) {
  const manifestPath = resolve(distPath, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  return manifest;
}

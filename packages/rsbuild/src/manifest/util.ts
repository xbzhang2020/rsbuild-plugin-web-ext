import type { Dirent } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import type { BuildMode } from './types.js';

export function isDevMode(mode: BuildMode) {
  return mode === 'development';
}

export function isProdMode(mode: BuildMode) {
  return mode === 'production';
}

export function isJsEntryFile(file: string, name?: string) {
  if (name) {
    const ext = extname(file);
    const fileBaseName = basename(file, ext);
    if (fileBaseName !== name) return false;
  }
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(extname(file));
}

export const getSingleEntryFile = async (rootPath: string, srcDir: string, files: Dirent[], key: string) => {
  const srcPath = resolve(rootPath, srcDir);
  const entryFile = files.find((item) => item.isFile() && isJsEntryFile(item.name, key));
  if (entryFile) return resolve(srcPath, entryFile.name);

  const entryDir = files.find((item) => item.isDirectory() && item.name === key);
  if (entryDir) {
    const subFiles = await readdir(resolve(srcPath, entryDir.name), { withFileTypes: true });
    const entryFile = subFiles.find((item) => item.isFile() && isJsEntryFile(item.name, 'index'));
    if (entryFile) return resolve(srcPath, entryDir.name, entryFile.name);
  }
  return null;
};

export const getMultipleEntryFiles = async (rootPath: string, srcDir: string, files: Dirent[], key: string) => {
  const srcPath = resolve(rootPath, srcDir);
  const entryDir = files.find((item) => item.isDirectory() && item.name === key);
  if (!entryDir) return [];

  const entryPath: string[] = [];
  const subFiles = await readdir(resolve(srcPath, entryDir.name), { withFileTypes: true });
  for (const item of subFiles) {
    if (item.isFile() && isJsEntryFile(item.name)) {
      entryPath.push(resolve(srcPath, entryDir.name, item.name));
    } else if (item.isDirectory()) {
      const grandChildFiles = await readdir(resolve(srcPath, entryDir.name, item.name), {
        withFileTypes: true,
      });
      const indexFile = grandChildFiles.find((item) => item.isFile() && isJsEntryFile(item.name, 'index'));
      if (indexFile) {
        entryPath.push(resolve(srcPath, entryDir.name, item.name, indexFile.name));
      }
    }
  }

  return entryPath;
};

export const getAssetFiles = async (
  rootPath: string,
  srcDir: string,
  files: Dirent[],
  filter = (asset: string) => true,
) => {
  const srcPath = resolve(rootPath, srcDir);
  const assets = files.find((item) => item.isDirectory() && item.name === 'assets');
  if (!assets) return [];
  const subFiles = await readdir(resolve(srcPath, assets.name), { recursive: true });
  return subFiles.filter(filter).map((item) => resolve(srcPath, assets.name, item));
};

export async function readPackageJson(rootPath: string) {
  const filePath = resolve(rootPath, './package.json');
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function getFileContent(rootPath: string, filePath: string) {
  const code = await readFile(resolve(rootPath, filePath), 'utf-8');
  return code;
}

import type { BuildMode } from './manifest.js';
import type { Dirent } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export function isDevMode(mode?: BuildMode) {
  if (mode) return mode === 'development';
  return process.env.NODE_ENV === 'development';
}

export function getFileName(path: string) {
  const res = path.split('/');
  return res.pop() || '';
}

export function getFileBaseName(file: string) {
  return file.split('.')[0];
}

export function isJsFile(file: string, baseName = '') {
  const fileBaseName = getFileBaseName(getFileName(file));
  if (baseName && fileBaseName !== baseName) return false;
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(file);
}

export const getSingleEntryFilePath = async (srcPath: string, files: Dirent[], key: string) => {
  const entryFile = files.find((item) => item.isFile() && isJsFile(item.name, key));
  if (entryFile) return [resolve(srcPath, `./${entryFile.name}`)];

  const entryDir = files.find((item) => item.isDirectory() && item.name === key);
  if (entryDir) {
    const subFiles = await readdir(resolve(srcPath, entryDir.name), { withFileTypes: true });
    const entryFile = subFiles.find((item) => item.isFile() && isJsFile(item.name, 'index'));
    if (entryFile) return [resolve(srcPath, `./${entryDir.name}/${entryFile.name}`)];
  }
  return [];
};

export const getMultipleEntryFilePath = async (srcPath: string, files: Dirent[], key: string) => {
  const entryDir = files.find((item) => item.isDirectory() && item.name === key);
  if (!entryDir) return [];

  const entryPath: string[] = [];
  const subFiles = await readdir(resolve(srcPath, entryDir.name), { withFileTypes: true });
  for (const item of subFiles) {
    if (item.isFile() && isJsFile(item.name)) {
      entryPath.push(resolve(srcPath, `./${entryDir.name}/${item.name}`));
    } else if (item.isDirectory()) {
      const grandChildFiles = await readdir(resolve(srcPath, entryDir.name, item.name), {
        withFileTypes: true,
      });
      const indexFile = grandChildFiles.find((item) => item.isFile() && isJsFile(item.name, 'index'));
      if (indexFile) {
        entryPath.push(resolve(srcPath, `./${entryDir.name}/${item.name}/${indexFile.name}`));
      }
    }
  }

  return entryPath;
};

export const getAssetPaths = async (srcPath: string, files: Dirent[], filter = (asset: string) => true) => {
  const assets = files.find((item) => item.isDirectory() && item.name === 'assets');
  if (!assets) return [];
  const subFiles = await readdir(resolve(srcPath, assets.name), { recursive: true });
  return subFiles.filter(filter).map((item) => resolve(srcPath, `./${assets.name}/${item}`));
};

export async function readPackageJson(rootPath: string) {
  try {
    const filePath = resolve(rootPath, './package.json');
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.warn('Failed to read package.json:', err instanceof Error ? err.message : err);
    return {};
  }
}

/**
 *
 * @param rootPath absolute path
 * @param filePath relative path or absolute path
 * @returns
 */
export async function readFileContent(rootPath: string, filePath: string) {
  const code = await readFile(resolve(rootPath, filePath), 'utf-8');
  return code;
}

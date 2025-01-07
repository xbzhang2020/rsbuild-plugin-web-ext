import type { Dirent } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';

function isJavaScriptFile(file: string, name?: string) {
  if (name) {
    const ext = extname(file);
    const fileBaseName = basename(file, ext);
    if (fileBaseName !== name) return false;
  }
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(extname(file));
}

export const getSingleEntryFile = async (srcPath: string, files: Dirent[], key: string) => {
  const entryFile = files.find((item) => item.isFile() && isJavaScriptFile(item.name, key));
  if (entryFile) {
    return resolve(srcPath, entryFile.name);
  }

  const entryDir = files.find((item) => item.isDirectory() && item.name === key);
  if (entryDir) {
    const subFiles = await readdir(resolve(srcPath, entryDir.name), { withFileTypes: true });
    const entryFile = subFiles.find((item) => item.isFile() && isJavaScriptFile(item.name, 'index'));
    if (entryFile) return resolve(srcPath, entryDir.name, entryFile.name);
  }
  return null;
};

export const getMultipleEntryFiles = async (srcPath: string, files: Dirent[], key: string) => {
  const entryDir = files.find((item) => item.isDirectory() && item.name === key);
  if (!entryDir) return [];

  const res: string[] = [];
  const subFiles = await readdir(resolve(srcPath, entryDir.name), { withFileTypes: true });
  for (const item of subFiles) {
    const subFilePath = resolve(srcPath, entryDir.name, item.name);
    if (item.isFile() && isJavaScriptFile(item.name)) {
      res.push(subFilePath);
      continue;
    }
    if (item.isDirectory()) {
      const grandChildFiles = await readdir(resolve(srcPath, entryDir.name, item.name), {
        withFileTypes: true,
      });
      const indexFile = grandChildFiles.find((item) => item.isFile() && isJavaScriptFile(item.name, 'index'));
      if (indexFile) {
        res.push(resolve(subFilePath, indexFile.name));
      }
    }
  }
  return res;
};

const getAssetFiles = async (rootPath: string, srcDir: string, files: Dirent[], filter = (asset: string) => true) => {
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

export function getEntryFiles(srcPath: string, files: string[], pattern: RegExp[]) {
  return files.filter((item) => pattern.some((p) => p.test(item))).map((item) => resolve(srcPath, item));
}

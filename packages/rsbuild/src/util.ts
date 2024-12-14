import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export function getFileName(path: string) {
  const res = path.split('/');
  return res.pop();
}

export function getFileBaseName(file: string) {
  return file.split('.')[0];
}

export function isJsFile(file: string) {
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(file);
}

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

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export function getFileName(file: string) {
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

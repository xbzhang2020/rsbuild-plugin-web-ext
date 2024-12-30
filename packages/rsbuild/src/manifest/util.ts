import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { glob } from 'glob';

export const GLOB_JS_EXT = '.{ts,tsx,js,jsx,mjs,cjs}';

export async function getGlobFiles(rootPath: string, srcDir: string, paths: string[]) {
  const srcPath = resolve(rootPath, srcDir);
  const jsFiles = await glob(paths, { cwd: srcPath });
  const res = jsFiles.map((item) => resolve(srcPath, item));
  return res;
}

export async function readPackageJson(rootPath: string) {
  const filePath = resolve(rootPath, './package.json');
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function getFileContent(rootPath: string, filePath: string) {
  const code = await readFile(resolve(rootPath, filePath), 'utf-8');
  return code;
}

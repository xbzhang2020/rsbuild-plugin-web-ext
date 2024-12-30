import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { glob } from 'glob';

const jsExt = '.{ts,tsx,js,jsx,mjs,cjs}';

export const getSingleEntryFile = async (rootPath: string, srcDir: string, key: string) => {
  const srcPath = resolve(rootPath, srcDir);
  const jsFiles = await glob([`${key}${jsExt}`, `${key}/index${jsExt}`], { cwd: srcPath });
  const res = jsFiles.map((item) => resolve(srcPath, item));
  return res[0];
};

export const getMultipleEntryFiles = async (rootPath: string, srcDir: string, key: string) => {
  const srcPath = resolve(rootPath, srcDir);
  const jsFiles = await glob([`${key}/*${jsExt}`, `${key}/*/index${jsExt}`], { cwd: srcPath });
  const res = jsFiles.map((item) => resolve(srcPath, item));
  return res;
};

export const getAssetFiles = async (rootPath: string, srcDir: string) => {
  const srcPath = resolve(rootPath, srcDir);
  const imageFiles = await glob(['assets/**/*.png'], { cwd: srcPath });
  const res = imageFiles.map((item) => resolve(srcPath, item));
  return res;
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

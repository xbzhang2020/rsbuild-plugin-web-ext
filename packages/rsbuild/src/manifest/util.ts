import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function readPackageJson(rootPath: string) {
  const filePath = resolve(rootPath, './package.json');
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function getFileContent(rootPath: string, filePath: string) {
  const code = await readFile(resolve(rootPath, filePath), 'utf-8');
  return code;
}

interface GetEntryFilesProps {
  rootPath: string;
  srcDir: string;
  pattern: RegExp[];
  files: string[];
}

export function getEntryFiles({ files, pattern, rootPath, srcDir }: GetEntryFilesProps) {
  return files.filter((item) => pattern.some((p) => p.test(item))).map((item) => resolve(rootPath, srcDir, item));
}

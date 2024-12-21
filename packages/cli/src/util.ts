import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const getSrcDir = (rootPath: string, srcDir?: string | undefined) => {
  if (srcDir) return srcDir;
  return existsSync(resolve(rootPath, './src/')) ? './src' : './';
};

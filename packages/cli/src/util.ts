import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const getSrcDir = (rootPath: string, srcDir?: string | undefined) => {
  if (srcDir) return srcDir;
  return existsSync(resolve(rootPath, './src/')) ? './src' : './';
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

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
const globWatchFiles = [
  'background.{ts,tsx,js,jsx,mjs,cjs}',
  'background/index.{ts,tsx,js,jsx,mjs,cjs}',
  'content.{ts,tsx,js,jsx,mjs,cjs}',
  'content/index.{ts,tsx,js,jsx,mjs,cjs}',
  'contents/*.{ts,tsx,js,jsx,mjs,cjs}',
  'contents/*/index.{ts,tsx,js,jsx,mjs,cjs}',
  'popup.{ts,tsx,js,jsx,mjs,cjs}',
  'popup/index.{ts,tsx,js,jsx,mjs,cjs}',
  'options.{ts,tsx,js,jsx,mjs,cjs}',
  'options/index.{ts,tsx,js,jsx,mjs,cjs}',
  'devtools.{ts,tsx,js,jsx,mjs,cjs}',
  'devtools/index.{ts,tsx,js,jsx,mjs,cjs}',
  'sandbox.{ts,tsx,js,jsx,mjs,cjs}',
  'sandbox/index.{ts,tsx,js,jsx,mjs,cjs}',
  'sandboxes/*.{ts,tsx,js,jsx,mjs,cjs}',
  'sandboxes/*/index.{ts,tsx,js,jsx,mjs,cjs}',
  'assets/**/icon*.png',
  'newtab.{ts,tsx,js,jsx,mjs,cjs}',
  'newtab/index.{ts,tsx,js,jsx,mjs,cjs}',
  'history.{ts,tsx,js,jsx,mjs,cjs}',
  'history/index.{ts,tsx,js,jsx,mjs,cjs}',
  'bookmarks.{ts,tsx,js,jsx,mjs,cjs}',
  'bookmarks/index.{ts,tsx,js,jsx,mjs,cjs}',
  'sidepanel.{ts,tsx,js,jsx,mjs,cjs}',
  'sidepanel/index.{ts,tsx,js,jsx,mjs,cjs}',
];

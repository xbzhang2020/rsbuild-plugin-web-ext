import { basename } from 'node:path';
import chokidar from 'chokidar';
import type { ChokidarOptions } from 'chokidar';
import { debounce } from './util.js';

export type RestartCallback = (props: { filePath: string; }) => Promise<unknown> | unknown;

type Cleaner = () => Promise<unknown> | unknown;

interface WatchFilesForRestartProps {
  root: string;
  files: string[];
  restart: RestartCallback;
  watchOptions?: ChokidarOptions;
}

export async function watchFilesForRestart({
  files,
  root,
  restart,
  watchOptions = {},
}: WatchFilesForRestartProps): Promise<void> {
  if (!files.length) {
    return;
  }

  const watcher = chokidar.watch(files, {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    cwd: root,
    ...watchOptions,
  });

  const callback = debounce(async (filePath) => {
    watcher.close();
    await restart({ filePath });
  }, 300);

  watcher.on('add', callback);
  watcher.on('change', callback);
  watcher.on('unlink', callback);
}

let cleaners: Cleaner[] = [];

export function onBeforeRestart(cleaner: Cleaner) {
  cleaners.push(cleaner);
}

export async function beforeRestart({
  filePath,
  id,
  clear = true,
}: { filePath?: string; id: string; clear?: boolean }) {
  if (clear) {
    console.clear();
  }

  if (filePath) {
    const filename = basename(filePath);
    console.info(`Restart ${id} because ${filename} is changed.\n`);
  } else {
    console.info(`Restarting ${id}...\n`);
  }

  for (const cleaner of cleaners) {
    await cleaner();
  }
  cleaners = [];
}

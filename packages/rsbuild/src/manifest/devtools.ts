import type { ManifestEntryInput, ManifestEntryProcessor } from './types.js';
import { getEntryFiles, getMultipleEntryFiles } from './util.js';
import { dirname } from 'node:path';
import { readdir } from 'node:fs/promises';

const key = 'devtools';
const pattern = [/^devtools([\\/]index)?\.(ts|tsx|js|jsx|mjs|cjs)$/];

const mergeDevtoolsEntry: ManifestEntryProcessor['merge'] = async ({ manifest, files, srcPath }) => {
  const { devtools_page } = manifest;
  if (devtools_page) return;

  const entryPath = getEntryFiles(srcPath, files, pattern);
  if (entryPath[0]) {
    manifest.devtools_page = entryPath[0];
  }
};

const readDevtoolsEntry: ManifestEntryProcessor['read'] = async (manifest) => {
  const { devtools_page } = manifest || {};
  if (!devtools_page) return null;

  const entry: ManifestEntryInput = {
    devtools: {
      input: [devtools_page],
      html: true,
    },
  };

  const srcPath = dirname(devtools_page);
  const files = await readdir(srcPath, { withFileTypes: true });
  const panels = await getMultipleEntryFiles(srcPath, files, 'panels');
  for (const file of panels) {
    const res = file.match(/([^\\/]+)([\\/]index)?\.(ts|tsx|js|jsx|mjs|cjs)$/);
    const name = res?.[1];
    if (name) {
      entry[name] = {
        input: [file],
        html: true,
      };
    }
  }

  return entry;
};

const writeDevtoolsEntry: ManifestEntryProcessor['write'] = ({ manifest, name }) => {
  manifest.devtools_page = `${name}.html`;
};

const devtoolsProcessor: ManifestEntryProcessor = {
  key,
  match: (entryName) => entryName === 'devtools',
  merge: mergeDevtoolsEntry,
  read: readDevtoolsEntry,
  write: writeDevtoolsEntry,
};

export default devtoolsProcessor;

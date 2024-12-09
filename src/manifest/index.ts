import { existsSync } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { EnvironmentContext, Rspack } from '@rsbuild/core';
import { getRsbuildEntryFile } from '../rsbuild.js';
import { getFileName, isDev, isJsFile, readPackageJson } from '../util.js';
import { getBackgroundEntry, mergeBackgroundEntry, writeBackgroundEntry } from './background.js';
import { getContentsEntry, mergeContentsEntry, writeContentsEntry } from './content.js';
import { getDevtoolsEntry, mergeDevtoolsEntry, writeDevtoolsEntry } from './devtools.js';
import { mergeIconsEntry } from './icons.js';
import type {
  BrowserTarget,
  Manifest,
  ManifestV3,
  NormalizeManifestProps,
  WriteMainfestEntryProps,
} from './manifest.js';
import { getOptionsEntry, mergeOptionsEntry, writeOptionsEntry } from './options.js';
import { getPopupEntry, mergePopupEntry, writePopupEntry } from './popup.js';
import { getSandboxEntry, mergeSandboxEntry, writeSandboxEntry } from './sandbox.js';

export { copyIcons } from './icons.js';

type EntryProcessor = {
  match: (key: string) => boolean;
  merge: (props: NormalizeManifestProps & { entryPath: string | string[] }) => void;
  write: (props: WriteMainfestEntryProps) => void | Promise<void>;
};

const entryProcessors: EntryProcessor[] = [
  { match: (key) => key === 'background', merge: mergeBackgroundEntry, write: writeBackgroundEntry },
  { match: (key) => key.startsWith('content'), merge: mergeContentsEntry, write: writeContentsEntry },
  { match: (key) => key === 'popup', merge: mergePopupEntry, write: writePopupEntry },
  { match: (key) => key === 'options', merge: mergeOptionsEntry, write: writeOptionsEntry },
  { match: (key) => key === 'devtools', merge: mergeDevtoolsEntry, write: writeDevtoolsEntry },
  { match: (key) => key.startsWith('sandbox'), merge: mergeSandboxEntry, write: writeSandboxEntry },
];

export async function normalizeManifest(props: NormalizeManifestProps) {
  const { manifest, rootPath, target } = props;
  let finalManifest = {} as ManifestV3;
  const defaultManifest = (await getDefaultManifest(rootPath, target)) as ManifestV3;

  finalManifest = {
    ...defaultManifest,
    ...((manifest || {}) as ManifestV3),
  };

  if (isDev()) {
    finalManifest.version_name ??= `${finalManifest.version} (development)`;
    finalManifest.permissions ??= [];
    finalManifest.host_permissions ??= [];

    if (!finalManifest.permissions.includes('scripting')) {
      finalManifest.permissions.push('scripting');
    }

    if (!finalManifest.host_permissions.includes('*://*/*')) {
      finalManifest.host_permissions.push('*://*/*');
    }
  }

  await mergeManifestEntries({
    ...props,
    manifest: finalManifest,
  });
  return finalManifest;
}

export async function getDefaultManifest(rootPath: string, target: BrowserTarget) {
  const manifest: Manifest = {
    manifest_version: target.includes('2') ? 2 : 3,
    name: '',
    version: '',
  };

  const pkg = await readPackageJson(rootPath);
  const { name, displayName, version, description, author, homepage } = pkg;
  return {
    ...manifest,
    ...(name && { name: displayName || name }),
    ...(version && { version }),
    ...(description && { description }),
    ...(author && { author }),
    ...(homepage && { homepage_url: homepage }),
  };
}

export async function mergeManifestEntries(props: NormalizeManifestProps) {
  const { srcPath } = props;

  try {
    const files = await readdir(srcPath, {
      withFileTypes: true,
    });

    const entries: Record<string, string[]> = {
      background: [],
      content: [],
      popup: [],
      options: [],
      devtools: [],
      sandbox: [],
    };

    for (const file of files) {
      const { name } = file;
      const filePath = `./${name}`;

      if (isJsFile(name)) {
        const key = getFileName(name);
        if (key in entries) {
          entries[key].unshift(filePath);
        }
        continue;
      }

      if (file.isDirectory() && ['assets', 'contents', 'sandboxes'].includes(name)) {
        const directoryPath = resolve(srcPath, filePath);
        const subFiles = await readdir(directoryPath, { recursive: true });
        let subFilePaths = subFiles.map((item) => `${filePath}/${item}`);

        if (name === 'assets') {
          mergeIconsEntry({ ...props, entryPath: subFilePaths });
        } else if (name === 'contents') {
          subFilePaths = subFilePaths.filter((item) => isJsFile(item));
          entries.content.push(...subFilePaths);
        } else if (name === 'sandboxes') {
          subFilePaths = subFilePaths.filter((item) => isJsFile(item));
          entries.sandbox.push(...subFilePaths);
        }
      }
    }

    for (const [key, entryPath] of Object.entries(entries)) {
      const processor = entryProcessors.find((item) => item.match(key));
      if (processor) {
        processor.merge({ ...props, entryPath });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export function readManifestEntries(manifest: Manifest) {
  return {
    background: getBackgroundEntry(manifest),
    content: getContentsEntry(manifest),
    popup: getPopupEntry(manifest),
    options: getOptionsEntry(manifest),
    devtools: getDevtoolsEntry(manifest),
    sandbox: getSandboxEntry(manifest),
  };
}

interface WriteManifestOptions {
  stats?: Rspack.Stats;
  environment: EnvironmentContext;
  originManifest?: Manifest;
}

export async function writeManifestEntries(
  manifest: Manifest,
  { stats, environment, originManifest }: WriteManifestOptions,
) {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return manifest;

  for (const [key, entrypoint] of Object.entries(entrypoints)) {
    const processor = entryProcessors.find((item) => item.match(key));
    if (!processor) continue;

    const assets = entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.'));
    if (!assets) continue;

    const props: WriteMainfestEntryProps = {
      key,
      assets,
      manifest,
      originManifest,
      rootPath: environment.config.root,
      entryPath: getRsbuildEntryFile(environment.entry, key),
    };
    await processor.write(props);
  }
}

export async function writeManifestFile(distPath: string, manifest: Manifest) {
  if (!existsSync(distPath)) return;
  const data = isDev() ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
  await writeFile(`${distPath}/manifest.json`, data);
  console.log('Built the extension successfully');
}

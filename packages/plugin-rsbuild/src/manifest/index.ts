import { existsSync } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { EnvironmentContext, Rspack } from '@rsbuild/core';
import { getRsbuildEntryFile } from '../rsbuild.js';
import type { BrowserTarget, Manifest, PluginWebExtOptions } from '../types.js';
import { getFileName, isJsFile, readPackageJson } from '../util.js';
import { getBackgroundEntry, mergeBackgroundEntry, writeBackgroundEntry } from './background.js';
import { getContentEntry, mergeContentEntry, writeContentEntry } from './content.js';
import { getDevtoolsEntry, mergeDevtoolsEntry, writeDevtoolsEntry } from './devtools.js';
import { mergeIconsEntry } from './icons.js';
import type { NormalizeMainfestEntryProps, NormalizeManifestProps, WriteMainfestEntryProps } from './manifest.js';
import { getOptionsEntry, mergeOptionsEntry, writeOptionsEntry } from './options.js';
import { getPopupEntry, mergePopupEntry, writePopupEntry } from './popup.js';
import { getSandboxEntry, mergeSandboxEntry, writeSandboxEntry } from './sandbox.js';

export { copyIcons } from './icons.js';

type EntryProcessor = {
  match: (entryName: string) => boolean;
  merge: (props: NormalizeMainfestEntryProps) => void;
  write: (props: WriteMainfestEntryProps) => void | Promise<void>;
};

const entryProcessors: EntryProcessor[] = [
  { match: (entryName) => entryName === 'background', merge: mergeBackgroundEntry, write: writeBackgroundEntry },
  { match: (entryName) => entryName.startsWith('content'), merge: mergeContentEntry, write: writeContentEntry },
  { match: (entryName) => entryName === 'popup', merge: mergePopupEntry, write: writePopupEntry },
  { match: (entryName) => entryName === 'options', merge: mergeOptionsEntry, write: writeOptionsEntry },
  { match: (entryName) => entryName === 'devtools', merge: mergeDevtoolsEntry, write: writeDevtoolsEntry },
  { match: (entryName) => entryName.startsWith('sandbox'), merge: mergeSandboxEntry, write: writeSandboxEntry },
];

export async function normalizeManifest(options: PluginWebExtOptions, rootPath: string, selfRootPath: string) {
  const { manifest = {}, target = 'chrome-mv3', srcDir = '.' } = options || {};

  const defaultManifest = await getDefaultManifest(rootPath, target);
  const finalManifest = {
    ...defaultManifest,
    ...(manifest as Manifest),
  } as Manifest;

  if (process.env.NODE_ENV === 'development') {
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
    manifest: finalManifest,
    target,
    srcPath: resolve(rootPath, srcDir),
    rootPath,
    selfRootPath,
  });
  return finalManifest;
}

export async function getDefaultManifest(rootPath: string, target?: BrowserTarget) {
  const manifest: Manifest = {
    manifest_version: target?.includes('2') ? 2 : 3,
    name: '',
    version: '',
  };

  const pkg = await readPackageJson(rootPath);
  const { name, displayName, version, description, author, homepage } = pkg;
  const trimVersion = version.match(/[\d\.]+/)?.[0];

  return {
    ...manifest,
    ...(name && { name: displayName || name }),
    ...(trimVersion && { version: trimVersion }),
    ...(description && { description }),
    ...(author && { author }),
    ...(homepage && { homepage_url: homepage }),
  } as Manifest;
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
        const entryName = getFileName(name);
        if (entryName in entries) {
          entries[entryName].unshift(filePath);
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

    for (const [entryName, entryPath] of Object.entries(entries)) {
      const processor = entryProcessors.find((item) => item.match(entryName));
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
    content: getContentEntry(manifest),
    popup: getPopupEntry(manifest),
    options: getOptionsEntry(manifest),
    devtools: getDevtoolsEntry(manifest),
    sandbox: getSandboxEntry(manifest),
  };
}

interface WriteManifestOptions {
  stats?: Rspack.Stats;
  environment: EnvironmentContext;
  optionManifest?: Manifest;
}

export async function writeManifestEntries(
  manifest: Manifest,
  { stats, environment, optionManifest }: WriteManifestOptions,
) {
  // refer to https://rspack.dev/api/javascript-api/stats-json
  const entrypoints = stats?.toJson().entrypoints;
  if (!entrypoints) return manifest;

  for (const [entryName, entrypoint] of Object.entries(entrypoints)) {
    const processor = entryProcessors.find((item) => item.match(entryName));
    if (!processor) continue;

    const assets = entrypoint.assets?.map((item) => item.name).filter((item) => !item.includes('.hot-update.'));
    if (!assets) continue;

    const props: WriteMainfestEntryProps = {
      entryName,
      assets,
      manifest,
      optionManifest,
      rootPath: environment.config.root,
      entryPath: getRsbuildEntryFile(environment.entry, entryName),
    };
    await processor.write(props);
  }
}

export async function writeManifestFile(distPath: string, manifest: Manifest) {
  if (!existsSync(distPath)) return;
  const data = process.env.NODE_ENV === 'development' ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
  await writeFile(`${distPath}/manifest.json`, data);
  console.log('Built the extension successfully');
}

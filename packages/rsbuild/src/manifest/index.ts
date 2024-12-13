import { existsSync } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { BrowserTarget, Manifest, PluginWebExtOptions } from '../types.js';
import { getFileBaseName, isJsFile, readPackageJson } from '../util.js';
import backgroundProcessor from './background.js';
import contentProcessor from './content.js';
import devtoolsProcessor from './devtools.js';
import iconsProcessor from './icons.js';
import type {
  ManifestEntry,
  ManifestEntryPoints,
  ManifestEntryProcessor,
  NormalizeManifestProps,
  WriteMainfestEntryProps,
} from './manifest.js';
import optionsProcessor from './options.js';
import popupProcessor from './popup.js';
import sandboxProcessor from './sandbox.js';

const entryProcessors: ManifestEntryProcessor[] = [
  backgroundProcessor,
  contentProcessor,
  popupProcessor,
  optionsProcessor,
  devtoolsProcessor,
  sandboxProcessor,
  iconsProcessor,
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

async function getDefaultManifest(rootPath: string, target?: BrowserTarget) {
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

async function mergeManifestEntries(props: NormalizeManifestProps) {
  const { srcPath } = props;

  try {
    const entries = entryProcessors.reduce(
      (res, cur) => Object.assign(res, { [cur.key]: [] }),
      {} as Record<ManifestEntryProcessor['key'], string[]>,
    );

    const files = await readdir(srcPath, {
      withFileTypes: true,
    });

    for (const file of files) {
      const filePath = `./${file.name}`;
      const processor = entryProcessors.find((item) => item.match(getFileBaseName(file.name)));
      if (!processor) continue;

      if (isJsFile(file.name)) {
        entries[processor.key].push(filePath);
        continue;
      }

      if (file.isDirectory()) {
        const subFiles = await readdir(resolve(srcPath, filePath), { recursive: true });
        let subFilePaths = subFiles.map((item) => `${filePath}/${item}`);
        if (processor.key !== 'icons') {
          subFilePaths = subFilePaths.filter((item) => isJsFile(item));
        }
        entries[processor.key].push(...subFilePaths);
      }
    }

    for (const [key, entryPath] of Object.entries(entries)) {
      const processor = entryProcessors.find((item) => item.key === key);
      processor?.merge({ ...props, entryPath });
    }
  } catch (err) {
    console.error(err);
  }
}

export function readManifestEntries(manifest: Manifest) {
  return entryProcessors.reduce(
    (res, processor) => Object.assign(res, { [processor.key]: processor.read(manifest) }),
    {} as Record<ManifestEntryProcessor['key'], ManifestEntry | null>,
  );
}

export interface WriteManifestProps {
  manifest: Manifest;
  optionManifest?: Manifest;
  rootPath: string;
  entrypoints: ManifestEntryPoints;
}

export async function writeManifestEntries({ manifest, optionManifest, rootPath, entrypoints }: WriteManifestProps) {
  for (const entryName in entrypoints) {
    const processor = entryProcessors.find((item) => item.match(entryName));
    if (!processor) continue;

    const props: WriteMainfestEntryProps = {
      entryName,
      entryPath: entrypoints[entryName].entryPath,
      assets: entrypoints[entryName].assets,
      manifest,
      optionManifest,
      rootPath,
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

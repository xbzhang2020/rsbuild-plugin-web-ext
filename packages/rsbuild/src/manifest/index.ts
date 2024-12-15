import { existsSync } from 'node:fs';
import { cp, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getFileBaseName, isJsFile, readPackageJson } from '../util.js';
import backgroundProcessor from './background.js';
import contentProcessor from './content.js';
import devtoolsProcessor from './devtools.js';
import iconsProcessor from './icons.js';
import type {
  BrowserTarget,
  Manifest,
  ManifestEntry,
  ManifestEntryPoints,
  ManifestEntryProcessor,
  NormalizeManifestProps,
  WriteMainfestEntryProps,
} from './manifest.js';
import optionsProcessor from './options.js';
import overrideProcessors from './overrides.js';
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
  ...overrideProcessors,
];

export async function normalizeManifest(options: {
  srcDir?: string;
  manifest?: unknown;
  target?: BrowserTarget;
  rootPath: string;
  selfRootPath: string;
}) {
  const { manifest = {}, target = 'chrome-mv3', srcDir = '.', rootPath, selfRootPath } = options || {};

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

    finalManifest.commands = {
      'web-ext-reload-extension': {
        suggested_key: {
          default: 'Alt+R',
          mac: 'Alt+R',
        },
        description: 'Reload the extension',
      },
      ...(finalManifest.commands || {}),
    };
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
    // const entries = entryProcessors.reduce(
    //   (res, cur) => Object.assign(res, { [cur.key]: [] }),
    //   {} as Record<ManifestEntryProcessor['key'], string[]>,
    // );

    const files = await readdir(srcPath, {
      withFileTypes: true,
    });

    for (const processor of entryProcessors) {
      await processor.merge({ ...props, files });
    }

    // for (const file of files) {
    //   const filePath = `./${file.name}`;
    //   const processor = entryProcessors.find((item) => item.match(getFileBaseName(file.name)));
    //   if (!processor) continue;

    //   if (file.isFile() && isJsFile(file.name)) {
    //     entries[processor.key].push(filePath);
    //     continue;
    //   }

    //   if (file.isDirectory()) {
    //     const subFiles = await readdir(resolve(srcPath, filePath), { withFileTypes: true });
    //     // 首先获取入口文件
    //     const entryFile = subFiles.find((item) => item.isFile() && isJsFile(item.name, 'index'));
    //     if (entryFile) {
    //       entries[processor.key].push(filePath);
    //     }

    //     let subFilePaths = subFiles.map((item) => `${filePath}/${item.name}`);
    //     if (processor.key !== 'icons') {
    //       subFilePaths = subFilePaths.filter((item) => isJsFile(item));
    //     }
    //     entries[processor.key].push(...subFilePaths);
    //   }
    // }

    // for (const [key, entryPath] of Object.entries(entries)) {
    //   const processor = entryProcessors.find((item) => item.key === key);
    //   processor?.merge({ ...props, entryPath });
    // }
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
  rootPath: string;
  entrypoints: ManifestEntryPoints;
}

export async function writeManifestEntries({ manifest, rootPath, entrypoints }: WriteManifestProps) {
  for (const entryName in entrypoints) {
    const processor = entryProcessors.find((item) => item.match(entryName));
    if (!processor) continue;

    const props: WriteMainfestEntryProps = {
      entryName,
      entryPath: entrypoints[entryName].entryPath,
      assets: entrypoints[entryName].assets,
      manifest,
      rootPath,
    };

    await processor.write(props);
  }
}

export async function writeManifestFile(distPath: string, manifest: Manifest) {
  if (!existsSync(distPath)) return;
  const data = process.env.NODE_ENV === 'development' ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
  await writeFile(`${distPath}/manifest.json`, data);
}

export async function copyPublicFiles(rootPath: string, distPath: string) {
  const publicPath = resolve(rootPath, 'public');
  if (!existsSync(publicPath) || !existsSync(distPath)) return;
  await cp(publicPath, distPath, { recursive: true, dereference: true });
}

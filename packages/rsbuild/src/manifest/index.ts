import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import backgroundProcessor from './background.js';
import contentProcessor from './content.js';
import devtoolsProcessor from './devtools.js';
import iconsProcessor from './icons.js';
import type {
  BrowserTarget,
  BuildMode,
  ManifestEntry,
  ManifestEntryProcessor,
  NormalizeManifestProps,
  WebExtensionManifest,
  WriteManifestProps,
} from './manifest.js';
import optionsProcessor from './options.js';
import overrideProcessor from './overrides.js';
import popupProcessor from './popup.js';
import sandboxProcessor from './sandbox.js';
import sidepanelProcessor from './sidepanel.js';
import { isDevMode, readPackageJson } from './util.js';

const entryProcessors: ManifestEntryProcessor[] = [
  backgroundProcessor,
  contentProcessor,
  popupProcessor,
  optionsProcessor,
  devtoolsProcessor,
  sandboxProcessor,
  iconsProcessor,
  overrideProcessor,
  sidepanelProcessor,
];

const getDefaultSrcDir = (rootPath: string) => {
  return existsSync(resolve(rootPath, './src/')) ? './src' : './';
};

export async function normalizeManifest({
  rootPath,
  selfRootPath,
  mode,
  manifest = {} as WebExtensionManifest,
  srcDir = getDefaultSrcDir(rootPath),
  target = 'chrome-mv3',
}: NormalizeManifestProps) {
  const defaultManifest = await getDefaultManifest(rootPath, target);
  const finalManifest = {
    ...defaultManifest,
    ...manifest,
  } as WebExtensionManifest;

  if (isDevMode(mode)) {
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

  try {
    const srcPath = resolve(rootPath, srcDir);
    const files = await readdir(srcPath, {
      withFileTypes: true,
    });
    for (const processor of entryProcessors) {
      await processor.merge({
        rootPath,
        selfRootPath,
        mode,
        manifest: finalManifest,
        target,
        srcDir,
        files,
      });
    }
  } catch (err) {
    console.error(err);
  }

  return finalManifest;
}

async function getDefaultManifest(rootPath: string, target?: BrowserTarget) {
  const manifest: Partial<WebExtensionManifest> = {
    manifest_version: target?.includes('2') ? 2 : 3,
  };

  const pkg = await readPackageJson(rootPath);
  const { name, displayName, version, description, author, homepage } = pkg;
  const trimVersion = version.match(/[\d\.]+/)?.[0];

  manifest.name ??= displayName || name;
  manifest.version ??= trimVersion;
  manifest.description ??= description;
  manifest.author ??= author;
  manifest.homepage_url ??= homepage;

  if (!manifest.name || !manifest.version) {
    throw new Error('manifest.name and manifest.version are required fields.');
  }

  return manifest;
}

export function readManifestEntries(manifest: WebExtensionManifest) {
  return entryProcessors.reduce(
    (res, processor) => Object.assign(res, { [processor.key]: processor.read(manifest) }),
    {} as Record<ManifestEntryProcessor['key'], ManifestEntry | null>,
  );
}

export async function writeManifestEntries({ manifest, rootPath, entrypoints }: WriteManifestProps) {
  for (const entryName in entrypoints) {
    const processor = entryProcessors.find((item) => item.match(entryName));
    if (!processor) continue;
    await processor.write({
      entryName,
      entryPath: entrypoints[entryName].entryPath,
      assets: entrypoints[entryName].assets,
      manifest,
      rootPath,
    });
  }
}

export async function writeManifestFile(distPath: string, manifest: WebExtensionManifest, mode?: BuildMode) {
  if (!existsSync(distPath)) {
    await mkdir(distPath, { recursive: true });
  }
  const data = isDevMode(mode) ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
  await writeFile(join(distPath, 'manifest.json'), data);
}

export async function copyPublicFiles(rootPath: string, distPath: string) {
  const publicPath = resolve(rootPath, 'public');
  if (!existsSync(publicPath) || !existsSync(distPath)) return;
  await cp(publicPath, distPath, { recursive: true, dereference: true });
}

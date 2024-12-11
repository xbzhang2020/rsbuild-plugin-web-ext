import type { RsbuildEntry } from '@rsbuild/core';
import { parseExportObject } from '../parser/export.js';
import type { ContentScriptConfig } from '../types.js';
import { readFileContent } from '../util.js';
import type { Manifest, NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './manifest.js';

export function mergeContentEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  const { content_scripts } = manifest;

  if (!content_scripts?.length && entryPath.length) {
    if (!manifest.content_scripts) {
      manifest.content_scripts = [];
    }

    for (const filePath of entryPath) {
      manifest.content_scripts.push({
        js: [filePath],
      });
    }
  }
}

export function getContentEntry(manifest?: Manifest) {
  const { content_scripts = [] } = manifest || {};
  if (!content_scripts.length) return null;

  const entry: RsbuildEntry = {};
  content_scripts.forEach((contentScript, index) => {
    const name = `content${content_scripts.length === 1 ? '' : index}`;
    const { js = [], css = [] } = contentScript;
    entry[name] = {
      import: [...js, ...css],
      html: false,
    };
  });
  return entry;
}

export async function writeContentEntry({
  manifest,
  optionManifest,
  rootPath,
  entryPath,
  entryName,
  assets,
}: WriteMainfestEntryProps) {
  const { content_scripts } = manifest;
  if (!content_scripts) return;
  const index = Number(entryName.replace('content', '') || '0');

  const declarative = !getContentEntry(optionManifest) && !!entryPath;
  if (declarative) {
    // declarative entry is a sinlge file
    const filePath = Array.isArray(entryPath) ? entryPath[0] : entryPath;
    const code = await readFileContent(rootPath, filePath);
    const extraConfig = parseExportObject<ContentScriptConfig>(code, 'config') || {
      matches: ['<all_urls>'],
    };

    if (extraConfig) {
      content_scripts[index] = {
        ...content_scripts[index],
        ...extraConfig,
      };
    }
  }

  const item = content_scripts[index];
  item.js = assets.filter((item) => item.endsWith('.js'));
  item.css = assets.filter((item) => item.endsWith('.css'));
}

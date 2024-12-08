import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { RsbuildEntry } from '@rsbuild/core';
import type { ContentConfig, Manifest } from '../manifest.js';
import type { NormalizeMainfestEntryProps, WriteMainfestEntryProps } from './process.js';

export function mergeContentsEntry({ manifest, entryPath }: NormalizeMainfestEntryProps) {
  const filePaths = entryPath as string[];
  const { content_scripts } = manifest;

  if (!content_scripts?.length && filePaths.length) {
    if (!manifest.content_scripts) {
      manifest.content_scripts = [];
    }

    for (const filePath of filePaths) {
      manifest.content_scripts.push({
        js: [filePath],
      });
    }
  }
}

export function getContentsEntry(manifest: Manifest) {
  const { content_scripts = [] } = manifest;
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

export async function writeContentsEntry({
  manifest,
  originManifest,
  rootPath,
  entryPath,
  key,
  assets,
}: WriteMainfestEntryProps) {
  const { content_scripts } = manifest;
  if (!content_scripts) return;
  const index = Number(key.replace('content', '') || '0');
  const declarative = !originManifest?.content_scripts?.length && entryPath;

  if (declarative) {
    // declarative entry is a sinlge file
    const filePath = Array.isArray(entryPath) ? entryPath[0] : entryPath;
    const code = await readFile(resolve(rootPath, filePath), 'utf-8');
    const extraConfig = getContentConfig(code) || {
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

function astToObject(node: t.Node): unknown {
  if (t.isObjectExpression(node)) {
    return node.properties.reduce((obj: Record<string, unknown>, property) => {
      if (t.isObjectProperty(property)) {
        const key = t.isIdentifier(property.key) ? property.key.name : (property.key as t.StringLiteral).value;
        obj[key] = astToObject(property.value);
      }
      return obj;
    }, {});
  }
  if (t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBooleanLiteral(node)) {
    return node.value;
  }
  if (t.isArrayExpression(node)) {
    return node.elements.map((element) => (element ? astToObject(element) : null));
  }
  return null;
}

function getContentConfig(code: string): ContentConfig | null {
  const configName = 'config';
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  let configValue: ContentConfig | null = null;

  traverse.default(ast, {
    ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>) {
      const declaration = path.node.declaration;
      if (t.isVariableDeclaration(declaration)) {
        const declarator = declaration.declarations[0];
        if (
          t.isVariableDeclarator(declarator) &&
          t.isIdentifier(declarator.id, { name: configName }) &&
          declarator.init
        ) {
          configValue = astToObject(declarator.init) as ContentConfig;
        }
      }
    },
  });

  return configValue;
}

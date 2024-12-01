import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { ManifestV3ContentConfig, ManifestV3 } from '../manifest.js';
import type { RsbuildEntry } from '@rsbuild/core';

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

function getContentConfig(code: string) {
  const configName = 'config';
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  let configValue: ManifestV3ContentConfig | null = null;

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
          configValue = astToObject(declarator.init) as ManifestV3ContentConfig;
        }
      }
    },
  });
  return configValue;
}

async function getManifestContents(rootPath: string, contentFilePath: string) {
  const path = resolve(rootPath, contentFilePath);
  const data = await readFile(path, 'utf-8');
  if (!data) return;

  const extraConfig = getContentConfig(data) || {};

  const config: ManifestV3ContentConfig = {
    ...extraConfig,
    js: [contentFilePath],
  };

  return [config];
}

export async function mergeContentsEntry(myManifest: ManifestV3, rootPath: string, filePath: string) {
  if (myManifest.content_scripts?.length) return;
  const data = await getManifestContents(rootPath, filePath);
  if (data) {
    myManifest.content_scripts = data;
  }
}

export function getContentsEntry(manifest: ManifestV3) {
  const entry: RsbuildEntry = {};
  manifest.content_scripts?.forEach((contentScript, index) => {
    const name = `content${index === 0 ? '' : index}`;
    const { js = [], css = [] } = contentScript;
    entry[name] = {
      import: [...js, ...css],
      html: false,
    };
  });
  return entry;
}

export function writeContentsEntry(manifest: ManifestV3, key: string, assets: string[]) {
  if (!manifest.content_scripts) return;
  const index = Number(key.replace('content', '') || '0');
  manifest.content_scripts[index].js = assets.filter((item) => item.endsWith('.js'));
  manifest.content_scripts[index].css = assets.filter((item) => item.endsWith('.css'));
}

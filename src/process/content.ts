import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { RsbuildEntry } from '@rsbuild/core';
import type { ContentConfig, ManifestV3 } from '../manifest.js';

export function mergeContentsEntry(manifest: ManifestV3, rootPath: string, filePaths: string[]) {
  if (manifest.content_scripts?.length) return;

  if (!manifest.content_scripts) {
    manifest.content_scripts = [];
  }
  for (const filePath of filePaths) {
    manifest.content_scripts.push({
      js: [filePath],
    });
  }

  if (process.env.NODE_ENV === 'development') {
    const defaultContent = resolve(__dirname, './assets/default-content.js');
    for (const script of manifest.content_scripts) {
      script.js?.unshift(defaultContent);
    }
  }
  console.log('content', manifest);
}

export function getContentsEntry(manifest: ManifestV3) {
  const entry: RsbuildEntry = {};
  const contentScripts = manifest.content_scripts || [];
  contentScripts.forEach((contentScript, index) => {
    const name = `content${contentScripts.length === 1 ? '' : index}`;
    const { js = [], css = [] } = contentScript;
    entry[name] = {
      import: [...js, ...css],
      html: false,
    };
  });
  return entry;
}

export async function writeContentsEntry(
  manifest: ManifestV3,
  key: string,
  assets: string[],
  extra: {
    originManifest: ManifestV3 | undefined;
    rootPath: string;
    filePath: string;
  },
) {
  if (!manifest.content_scripts) return;
  const { originManifest, rootPath, filePath } = extra;
  const index = Number(key.replace('content', '') || '0');
  const explicit = originManifest?.content_scripts?.length;

  if (!explicit) {
    const path = resolve(rootPath, filePath);
    const code = await readFile(path, 'utf-8');
    const extraConfig = getContentConfig(code) || {
      matches: ['<all_urls>'],
    };

    if (extraConfig) {
      manifest.content_scripts[index] = {
        ...manifest.content_scripts[index],
        ...extraConfig,
      };
    }
  }

  const item = manifest.content_scripts[index];
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

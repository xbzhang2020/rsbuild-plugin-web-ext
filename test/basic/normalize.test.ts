import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { normalizeManifest } from '../../src/manifest/index.js';
import type { ManifestV3 } from '../../src/manifest/manifest.js';
import pkg from './package.json';

describe('normalizeManifest', () => {
  const rootPath = import.meta.dirname;
  const srcPath = `${rootPath}`;
  const selfRootPath = resolve(import.meta.dirname, '../../src');
  const defaultManifest = {} as ManifestV3;

  it('should have default manifest', async () => {
    const manifest = await normalizeManifest({
      manifest: defaultManifest,
      target: 'chrome-mv3',
      rootPath,
      srcPath,
      selfRootPath,
    });
    const { name, description } = pkg;

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe(name);
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.description).toBe(description);
  });

  it('should merge manifest', async () => {
    const manifest = await normalizeManifest({
      manifest: {
        manifest_version: 3,
        name: 'test',
        version: '0.0.1',
      },
      target: 'chrome-mv3',
      rootPath,
      srcPath,
      selfRootPath,
    });

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('test');
    expect(manifest.version).toBe('0.0.1');
  });
});

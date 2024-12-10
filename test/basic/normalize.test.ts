import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeManifest } from '../../src/manifest/index.js';
import type { Manifest, PluginWebExtOptions } from '../../src/types.js';
import pkg from './package.json';

describe('normalizeManifest', () => {
  const rootPath = import.meta.dirname;
  const selfRootPath = resolve(import.meta.dirname, '../../src');

  it('should be default manifest', async () => {
    const manifest = await normalizeManifest({}, rootPath, selfRootPath);
    const { name, description, version } = pkg;

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe(name);
    expect(manifest.version).toBe(version.split('-')[0]);
    expect(manifest.description).toBe(description);
  });

  it('should merge manifest rightly', async () => {
    const options: PluginWebExtOptions<Manifest> = {
      manifest: {
        manifest_version: 3,
        name: 'test',
        version: '0.0.1',
      },
    };
    const manifest = await normalizeManifest(options, rootPath, selfRootPath);

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe(options.manifest?.name);
    expect(manifest.version).toBe('0.0.1');
  });
});

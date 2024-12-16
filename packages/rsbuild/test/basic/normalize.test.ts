import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeManifest } from '../../src/manifest/index.js';
import pkg from './package.json';

describe('normalizeManifest', () => {
  const rootPath = import.meta.dirname;
  const selfRootPath = resolve(import.meta.dirname, '../../src');

  it('should be default manifest', async () => {
    const manifest = await normalizeManifest({
      rootPath,
      selfRootPath,
    });
    const { name, description, version } = pkg;

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe(name);
    expect(manifest.version).toBe(version.split('-')[0]);
    expect(manifest.description).toBe(description);
  });

  it('should merge manifest rightly', async () => {
    const defaultManifest = {
      manifest_version: 3,
      name: 'test',
      version: '0.0.1',
      background: {
        service_worker: './background.ts',
      },
    };

    const manifest = await normalizeManifest({ manifest: defaultManifest, rootPath, selfRootPath });

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe(defaultManifest.name);
    expect(manifest.version).toBe(defaultManifest.version);
    expect(manifest.background?.service_worker).toBe(defaultManifest.background?.service_worker);
  });
});

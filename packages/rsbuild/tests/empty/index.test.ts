import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { describe, expect, it } from 'vitest';
import { pluginWebExt } from '../../src/index.js';
import pkg from './package.json' with { type: 'json' };

const __dirname = import.meta.dirname;

describe('empty', () => {
  it('should be empty', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [pluginWebExt()],
      },
    });

    await rsbuild.build();
    const manifestPath = resolve(__dirname, 'dist/manifest.json');
    expect(existsSync(manifestPath)).toBe(true);

    const manifest: chrome.runtime.ManifestV3 = JSON.parse(await readFile(manifestPath, 'utf-8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe(pkg.name);
    expect(manifest.version).toBe(pkg.version);
    expect(manifest.description).toBe(pkg.description);
    expect(manifest.author).toBe(pkg.author);
    expect(manifest.homepage_url).toBe(pkg.homepage);
  });
});

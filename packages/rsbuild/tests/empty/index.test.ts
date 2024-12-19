import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { initRsbuild } from '../helper.js';
import pkg from './package.json' with { type: 'json' };

const __dirname = import.meta.dirname;

describe('empty', () => {
  it('should build successfully with empty manifest', async () => {
    const rsbuild = await initRsbuild({
      cwd: __dirname,
      mode: 'production',
    });
    await rsbuild.build();

    const distPath = rsbuild.context.distPath;
    const manifestPath = resolve(distPath, 'manifest.json');
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const { manifest_version, name, version, description, author, homepage_url } = manifest;

    expect(manifest_version).toBe(3);
    expect(name).toBe(pkg.name);
    expect(version).toBe(pkg.version.split('-')[0]);
    expect(description).toBe(pkg.description);
    expect(author).toBe(pkg.author);
    expect(manifest.homepage_url).toBe(pkg.homepage);
  });
});

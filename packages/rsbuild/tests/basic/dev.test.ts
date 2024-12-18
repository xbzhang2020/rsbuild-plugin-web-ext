import { describe, expect, it } from 'vitest';
import { initRsbuild, readManifest } from '../helper.js';

const __dirname = import.meta.dirname;

describe('basic in dev mode', () => {
  it('should build successfully', async () => {
    const rsbuild = await initRsbuild({
      cwd: __dirname,
      mode: 'development',
      outDir: 'dist/chrome-mv3-dev',
    });
    const { server } = await rsbuild.startDevServer();
    const distPath = rsbuild.context.distPath;

    return new Promise((resolve, reject) => {
      rsbuild.onDevCompileDone(async () => {
        const manifest = await readManifest(distPath);
        const { manifest_version } = manifest as chrome.runtime.ManifestV3;
        expect(manifest_version).toBe(3);

        server.close();
        resolve({});
      });
    });
  });
});

import { describe, expect, test } from 'vitest';
import { normalizeManifest } from '../../src/manifest/index.js';
import type { ManifestV3 } from '../../src/manifest/manifest.js';

describe('normalizeManifest', () => {
  const rootPath = import.meta.dirname;
  const srcPath = `${rootPath}/src`;
  const selfRootPath = `${rootPath}/test/fixtures/basic`;
  const defaultManifest = {} as ManifestV3;

  test('should normalize basic manifest fields', async () => {
    const manifest = await normalizeManifest({
      manifest: defaultManifest,
      target: 'chrome-mv3',
      rootPath,
      srcPath,
      selfRootPath,
    });

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('basic');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.description).not.toBeNull();
  });

  //   test('should add development fields in dev mode', async () => {
  //     process.env.NODE_ENV = 'development';

  //     const manifest = await normalizeManifest({
  //       manifest: {},
  //       target: 'chrome-mv3',
  //       rootPath,
  //       srcPath,
  //       selfRootPath,
  //     });

  //     expect(manifest.version_name).toBe('0.0.1 (development)');
  //     expect(manifest.permissions).toContain('scripting');
  //     expect(manifest.host_permissions).toContain('*://*/*');

  //     process.env.NODE_ENV = 'test';
  //   });

  //   test('should respect user provided manifest fields', async () => {
  //     const userManifest: Partial<ManifestV3> = {
  //       name: 'Custom Name',
  //       version: '1.0.0',
  //       description: 'Custom description',
  //       permissions: ['storage'],
  //       host_permissions: ['https://*.example.com/*'],
  //     };

  //     const manifest = await normalizeManifest({
  //       manifest: userManifest,
  //       target: 'chrome-mv3',
  //       rootPath,
  //       srcPath,
  //       selfRootPath,
  //     });

  //     expect(manifest.name).toBe('Custom Name');
  //     expect(manifest.version).toBe('1.0.0');
  //     expect(manifest.description).toBe('Custom description');
  //     expect(manifest.permissions).toContain('storage');
  //     expect(manifest.host_permissions).toContain('https://*.example.com/*');
  //   });

  //   test('should handle different manifest versions based on target', async () => {
  //     const mv2Manifest = await normalizeManifest({
  //       manifest: {},
  //       target: 'firefox-mv2',
  //       rootPath,
  //       srcPath,
  //       selfRootPath,
  //     });

  //     const mv3Manifest = await normalizeManifest({
  //       manifest: {},
  //       target: 'chrome-mv3',
  //       rootPath,
  //       srcPath,
  //       selfRootPath,
  //     });

  //     expect(mv2Manifest.manifest_version).toBe(2);
  //     expect(mv3Manifest.manifest_version).toBe(3);
  //   });
});

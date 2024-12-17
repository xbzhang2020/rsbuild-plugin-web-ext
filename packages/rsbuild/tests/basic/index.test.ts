import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { describe, expect, it } from 'vitest';
import { pluginWebExt } from '../../src/index.js';
import { getFileExt } from '../helper.js';
import { config as contentConfig } from './src/content.js';
import { title as popupTitle } from './src/popup/index.js';

const __dirname = import.meta.dirname;

describe('basic', () => {
  it('should build successfully', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [pluginWebExt()],
        output: {
          distPath: {
            root: 'dist/prod',
          },
          sourceMap: false,
        },
      },
    });
    await rsbuild.build();

    const distPath = rsbuild.context.distPath;
    const manifestPath = resolve(distPath, 'manifest.json');
    const manifest: chrome.runtime.ManifestV3 = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const {
      manifest_version,
      background,
      content_scripts = [],
      action,
      options_ui,
      devtools_page,
      chrome_url_overrides,
      sandbox,
      icons,
      side_panel,
    } = manifest;

    function existFile(name: string, ext: string) {
      if (!name) return false;
      return existsSync(resolve(distPath, name)) && getFileExt(name) === ext;
    }

    expect(manifest_version).toBe(3);

    // icons
    const iconPaths = Object.values(icons || {}) || [];
    expect(iconPaths).toHaveLength(5);
    iconPaths.forEach((iconPath) => {
      expect(existFile(iconPath, 'png')).toBeTruthy();
    });

    // background
    expect(existFile(background?.service_worker || '', 'js')).toBeTruthy();

    // content_scripts
    expect(content_scripts).toHaveLength(3);
    const firstContentScript = content_scripts[0];
    expect(firstContentScript.matches).toEqual(contentConfig.matches);

    for (const contentScript of content_scripts) {
      const { js = [], css = [] } = contentScript;
      js.forEach((jsPath) => {
        expect(existFile(jsPath, 'js')).toBeTruthy();
      });
      css.forEach((cssPath) => {
        expect(existFile(cssPath, 'css')).toBeTruthy();
      });
    }

    // popup
    expect(existFile(action?.default_popup || '', 'html')).toBeTruthy();
    expect(action?.default_title).toBe(popupTitle);
    expect(action?.default_icon).toEqual(icons);

    // options
    expect(existFile(options_ui?.page || '', 'html')).toBeTruthy();

    // sandbox
    expect(existFile(sandbox?.pages[0] || '', 'html')).toBeTruthy();

    // devtools
    expect(existFile(devtools_page || '', 'html')).toBeTruthy();

    // newtab
    expect(existFile(chrome_url_overrides?.newtab || '', 'html')).toBeTruthy();

    // bookmarks
    expect(existFile(chrome_url_overrides?.bookmarks || '', 'html')).toBeTruthy();

    // history
    expect(existFile(chrome_url_overrides?.history || '', 'html')).toBeTruthy();

    // sidepanel
    expect(existFile(side_panel?.default_path || '', 'html')).toBeTruthy();
  });
});

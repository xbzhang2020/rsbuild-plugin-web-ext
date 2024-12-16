# rsbuild-plugin-web-ext

English | [简体中文](./README.zh-CN.md)

A Rsbuild plugin for developing and building browser extensions, making browser extension development simple and efficient.

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-web-ext">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-web-ext?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-web-ext?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-web-ext.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Features

- **[Declarative Development](#declarative-development)**. Automatically generate configuration based on directory structure, no complex setup needed.
- **HMR + Live-Reloading**. Live page updates with HMR and Live-Reloading.
- **TypeScript Support**. Out-of-the-box type support without additional configuration.
- **[Browser Compatibility](#browser-compatibility)**. Unified APIs and polyfills for easy multi-browser support.
- **Framework Agnostic**. Freedom to use any frontend framework and libraries.
- **Lightning Fast**. Blazing fast development and build powered by Rsbuild.

## Quick Start

### Installation

```bash
npm add rsbuild-plugin-web-ext -D
```

### Project Setup

1. Create your extension entry files: (refer to [Declarative Development](#declarative-development) for more details)

```
src/
├── assets/       # Icon Assets
├── popup.ts      # Extension popup
├── background.ts # Background service worker
└── content.ts    # Content script
```

2. Add the plugin in `rsbuild.config.ts`:

```ts
import { pluginWebExt } from "rsbuild-plugin-web-ext";

export default {
  plugins: [pluginWebExt()],
};
```

3. Add npm scripts:

```json
{
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build"
  }
}
```

### Development

- Run `npm run dev` to start the development server.
- Enable developer mode in browser extensions page and load the `dist` directory.
- Run `npm run build` to build for production.

## Options

### manifest

The manifest configuration for the browser extension. If not specified, it will be automatically generated based on the directory structure.

### srcDir

Source directory path. Defaults to `./src`, falling back to project root (`./`) if `src` directory doesn't exist.

### target

Target browser, supports:

- `chrome-mv3` (default)
- `firefox-mv3`
- `firefox-mv2`
- `safari-mv3`

<h2 id="declarative-development">Declarative Development</h2>

Supports automatic configuration generation based on the following directory structure:

| Manifest Field             | File Path                                                   |
| -------------------------- | ----------------------------------------------------------- |
| `name`                     | `displayName` or `name` in package.json                     |
| `version`                  | `version` in package.json                                   |
| `description`              | `description` in package.json                               |
| `author`                   | `author` in package.json                                    |
| `homepage_url`             | `homepage` in package.json                                  |
| `icons`                    | `assets/icon-[size].png`                                    |
| `action`                   | `popup.ts` or `popup/index.ts`                              |
| `background`               | `background.ts` or `background/index.ts`                    |
| `content_scripts`          | single file `content.ts` or multiple files `contents/*.ts`  |
| `options_ui`               | `options.ts` or `options/index.ts`                          |
| `devtools_page`            | `devtools.ts` or `devtools/index.ts`                        |
| `sandbox`                  | single file `sandbox.ts` or multiple files `sandboxes/*.ts` |
| `newtab`                   | `newtab.ts` or `newtab/index.ts`                            |
| `bookmarks`                | `bookmarks.ts` or `bookmarks/index.ts`                      |
| `history`                  | `history.ts` or `history/index.ts`                          |
| `side_panel`               | `sidepanel.ts` or `sidepanel/index.ts`                      |
| `_locales`                 | `public/_locales/*`                                         |
| `web_accessible_resources` | `public/*`                                                  |

**Note**: Entry files are located in `srcDir` (defaults to `./src`), except for `public` directory which is located in the project root.

<h2 id="browser-compatibility">Browser Compatibility</h2>

Default build target is Chrome MV3. Other browsers can be specified using the `target` option.

For cross-browser support, it's recommended to use:

- [`webextension-polyfill`](https://www.npmjs.com/package/webextension-polyfill) - Unified browser extension APIs.
- [`@types/webextension-polyfill`](https://www.npmjs.com/package/@types/webextension-polyfill) - TypeScript type definitions.

## Examples

There are lots of [examples](./examples) for you to refer to.

## License

[MIT](./LICENSE)

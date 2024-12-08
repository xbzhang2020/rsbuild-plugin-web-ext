# rsbuild-plugin-web-ext

English | [简体中文](./README-zh-CN.md)

A plugin for developing and building browser extensions within Rsbuild.

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-web-ext">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-web-ext?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-web-ext?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-web-ext.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Features

* **Declarative Development.** Generates `manifest.json` and builds modules automatically from your directory structure - no complex configuration needed.

* **Seamless Live Development.** Instant page updates and true Hot Module Replacement (HMR) for content scripts, with optimized extension-specific reloading that eliminates manual refresh.

* **First-Class TypeScript Support.** Built-in TypeScript support with no additional setup required.

* **Cross-Browser Compatibility.** Unified APIs and polyfills for seamless development across Chrome, Firefox and Safari.

* **Framework Agnostic.** Complete freedom to use any frontend framework or library you prefer.

* **Blazing Fast Performance.** Leverages Rsbuild's optimized build system for lightning quick development and production builds.

## Usage

Install:

```bash
npm add rsbuild-plugin-web-ext -D
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginWebExt } from "rsbuild-plugin-web-ext";
import manifest from "./manifest";

export default {
  plugins: [
    pluginWebExt({
      manifest,
    }),
  ],
};
```

There are lots of [exampes](./examples/) for you.

## Options

### manifest

An object related to `manifest.json`。

- Type: `chrome.runtime.ManifestV3`
- Default: `undefined`
- Example:

```js
pluginWebExt({
  manifest,
});
```

## License

[MIT](./LICENSE).

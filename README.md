# rsbuild-plugin-web-ext

A plugin for developing and building browser extensions within Rsbuild.

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-web-ext">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-web-ext?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-web-ext?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-web-ext.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Features

* **Declarative Development with Fewer Configurations.** Inspired by Plasmo, it can automatically build modules and generate manifest.json based on the conventional directory structure.

* **Live-Reloading + HMR.** It will automatically reload the extension and refresh pages when watching changes of code. There is no longer  a need to reload the extension manually.

* **Natural TypeScript Support.**

* **Cross-browser Compatibility.** It supports Chrome, Firefox and Safari friendly.

* **No Frameworks Preference.** Just enjoy any frontend frameworks you like.

* **Lightning Fast.** Thanks to Rsbuild.

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

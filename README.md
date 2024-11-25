# rsbuild-plugin-web-ext

A plugin that builds web extension within Rsbuild.

<!-- <p>
  <a href="https://npmjs.com/package/rsbuild-plugin-web-ext">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-web-ext?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-web-ext?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-web-ext.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p> -->

## Usage

Install:

```bash
npm add rsbuild-plugin-web-ext -D
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginWebExt } from "rsbuild-plugin-web-ext";

export default {
  plugins: [pluginWebExt()],
};
```

## Options

### foo

Some description.

- Type: `string`
- Default: `undefined`
- Example:

```js
pluginWebExt({
  foo: "bar",
});
```

## License

[MIT](./LICENSE).

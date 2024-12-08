# rsbuild-plugin-web-ext

一个用于开发和构建浏览器扩展的 Rsbuild 插件。让浏览器扩展开发变得简单高效。

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-web-ext">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-web-ext?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-web-ext?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-web-ext.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## ✨ 特性

- **声明式开发** - 支持基于目录结构自动生成 manifest.json，无需复杂配置
- **实时开发体验** - 页面实时更新，支持 content scripts 的 HMR 和快速刷新
- **TypeScript 支持** - 开箱即用的 TypeScript 支持，无需额外配置
- **跨浏览器兼容** - 统一的 API 和 polyfills，轻松实现跨浏览器开发
- **框架无关** - 可以自由使用任何前端框架或库
- **极速构建** - 基于 Rsbuild 实现极速的开发和生产构建

## 🚀 快速开始

1. 安装：

```bash
npm add rsbuild-plugin-web-ext -D
```

2. 创建 `manifest.json` 配置扩展入口，或使用目录结构自动生成（参考 [声明式开发](#-声明式开发)）：

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0",
  "action": { "default_popup": "./popup.ts" },
  "background": { "service_worker": "./background.ts" },
  "content_scripts": [{ 
    "matches": ["<all_urls>"], 
    "js": ["./content.ts"] 
  }]
}
```

3. 在 `rsbuild.config.ts` 中添加插件：

```ts
import { pluginWebExt } from "rsbuild-plugin-web-ext";
import manifest from "./manifest.json";

export default {
  plugins: [
    pluginWebExt({
      manifest,
    }),
  ],
};
```

4. 在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build"
  }
}
```

5. 运行

- 运行 `npm run dev` 启动开发服务
- 在浏览器扩展页面开启开发者模式，加载 dist 目录
- 运行 `npm run build` 构建生产版本

## 📖 配置项

### manifest

浏览器扩展的 manifest 配置。如不指定，将基于约定目录结构自动生成。

### srcDir

源码目录路径，默认为项目根目录。

### target

目标浏览器，可选值：
- `chrome-mv3`（默认）
- `firefox-mv3` 
- `firefox-mv2`
- `safari-mv3`

## 🗂️ 声明式开发

支持基于以下目录结构自动生成配置：

| Manifest 字段 | 约定路径 |
|--------------|---------|
| `name` | package.json 的 `displayName` 或 `name` |
| `version` | package.json 的 `version` |
| `description` | package.json 的 `description` |
| `author` | package.json 的 `author` |
| `homepage_url` | package.json 的 `homepage` |
| `icons` | `assets/icon-[size].png` |
| `action` | `popup.ts` |
| `background` | `background.ts` |
| `content_scripts` | `content.ts` 或 `contents/*.ts` |
| `options_ui` | `options.ts` |
| `devtools_page` | `devtools.ts` |
| `sandbox` | `sandbox.ts` 或 `sandboxes/*.ts` |
| `_locales` | `public/_locales/*` |
| `web_accessible_resources` | `public/*` |

可通过 `srcDir` 选项自定义源码目录，如 `srcDir: 'src'`。

## 🌐 浏览器兼容

插件的运行时支持跨浏览器，默认的构建目标为 Chrome MV3。如需在项目中实现跨浏览器支持，推荐使用：

- [`webextension-polyfill`](https://www.npmjs.com/package/webextension-polyfill)
- [`@types/webextension-polyfill`](https://www.npmjs.com/package/@types/webextension-polyfill)

## 📝 示例

查看 [示例项目](./examples/) 了解更多使用方式。

## 📄 许可证

[MIT](./LICENSE)
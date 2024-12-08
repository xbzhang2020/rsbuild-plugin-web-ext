# rsbuild-plugin-web-ext

一个用于开发和构建浏览器扩展的 Rsbuild 插件，让浏览器扩展开发变得简单高效。

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-web-ext">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-web-ext?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-web-ext?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-web-ext.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## 特性

- **[声明式开发](#声明式开发)** - 基于目录结构自动生成配置，无需复杂设置
- **无缝的开发体验** - 实时页面更新，支持 content scripts 的 HMR 和快速刷新
- **TypeScript 支持** - 开箱即用的类型支持，无需额外配置
- **[浏览器兼容](#浏览器兼容)** - 统一的 API 和 polyfills，轻松实现多浏览器支持
- **框架无关** - 自由使用任何前端框架和库
- **极速性能** - 基于 Rsbuild 实现极速开发和构建

## 快速开始

### 安装

```bash
npm add rsbuild-plugin-web-ext -D
```

### 配置

1. 创建 `manifest.json` 配置扩展入口（也可使用[声明式开发](#-声明式开发)自动生成）：

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

2. 在 `rsbuild.config.ts` 中添加插件：

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

3. 添加 npm 脚本：

```json
{
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build"
  }
}
```

### 开发

- 运行 `npm run dev` 启动开发服务
- 在浏览器扩展页面开启开发者模式，加载 `dist` 目录
- 运行 `npm run build` 构建生产版本

## 配置项

### manifest

浏览器扩展的 manifest 配置。如不指定，将基于目录结构自动生成。

### srcDir

源码目录路径，默认为项目根目录。

### target

目标浏览器，支持：
- `chrome-mv3`（默认）
- `firefox-mv3` 
- `firefox-mv2`
- `safari-mv3`

## 声明式开发

支持基于以下目录结构自动生成配置：

| Manifest 字段 | 文件路径 |
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

可通过 `srcDir` 选项指定源码目录，如 `srcDir: 'src'`。

## 浏览器兼容

默认构建目标为 Chrome MV3，可以通过 `target` 选项指定其他浏览器。

如需跨浏览器支持，推荐使用：

- [`webextension-polyfill`](https://www.npmjs.com/package/webextension-polyfill) - 统一的浏览器扩展 API
- [`@types/webextension-polyfill`](https://www.npmjs.com/package/@types/webextension-polyfill) - TypeScript 类型定义

## 示例

查看[示例项目](./examples/)了解更多使用方式。

## 许可证

[MIT](./LICENSE)
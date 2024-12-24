import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const posibleConfigFiles = ['web-ext.config.mjs', 'web-ext.config.cjs', 'web-ext.config.js'];

export type TargetType = 'firefox-desktop' | 'firefox-android' | 'chromium';

export type LintMatcher = {
  code?: string;
  message?: string;
  file?: string;
};

export interface WebExtOptions {
  args?: Array<string>;
  artifactsDir?: string;
  browserConsole?: boolean;
  buildPackage?: boolean;
  chromiumBinary?: string;
  chromiumProfile?: string;
  devtools?: boolean;
  firefox?: string;
  firefoxPreview?: ['mv3'];
  firefoxProfile?: string;
  ignoreFiles?: Array<string>;
  keepProfileChanges?: boolean;
  noInput?: boolean;
  outputFilename?: string;
  overwriteDest?: boolean;
  pref?: { [key: string]: boolean | string | number };
  profileCreateIfMissing?: boolean;
  runLint?: boolean;
  lintWarningsAsErrors?: boolean;
  ignoreKnownChromeLintFailures?: boolean;
  filterLintFailures?: Array<LintMatcher>;
  selfHosted?: boolean;
  sourceDir?: string;
  startUrl?: string | Array<string>;
  target?: TargetType | Array<TargetType>;
  adbBin?: string;
  adbHost?: string;
  adbPort?: string;
  adbDevice?: string;
  adbDiscoveryTimeout?: number;
  adbRemoveOldArtifacts?: boolean;
  firefoxApk?: string;
  firefoxApkComponent?: string;
}

export async function loadWebExtConfig(root: string) {
  const configFile = posibleConfigFiles.map((item) => resolve(root, item)).find((item) => existsSync(item));
  if (!configFile) return null;
  try {
    const { default: config } = await import(configFile);
    return config;
  } catch (err) {
    console.error(`Loading ${configFile} failed. \n`, err);
    return null;
  }
}

export async function normalizeWebExtRunConfig(root: string, options: WebExtOptions) {
  const userConfig = await loadWebExtConfig(root);
  const userRunconfig = userConfig?.run || {};

  const config: WebExtOptions = {
    ...options,
    ...(userRunconfig || {}),
    noReload: true,
  };

  return config;
}

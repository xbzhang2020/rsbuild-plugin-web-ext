import { resolve } from 'node:path';
import { createRsbuild, loadConfig, loadEnv } from '@rsbuild/core';
import type { RsbuildMode } from '@rsbuild/core';
import { normalizeWebExtRunConfig } from './web-ext.js';
import type { TargetType } from './web-ext.js';
import { zipExtenison } from './zip.js';

interface CommonRunOptions {
  target?: string;
}

interface RsBuildOptions {
  root?: string;
  mode?: RsbuildMode;
  config?: string;
  envDir?: string;
  envMode?: string;
  open?: boolean | string;
  host?: string;
  port?: number;
  environment?: string[];
}

export interface DevOptions extends RsBuildOptions, CommonRunOptions {}

export interface BuildOptions extends RsBuildOptions, CommonRunOptions {
  zip?: boolean;
}

// forked from https://github.com/web-infra-dev/rsbuild/blob/main/packages/core/src/cli/init.ts
async function init({ cliOptions }: { cliOptions?: Omit<RsBuildOptions, 'target'> }) {
  const commonOpts = cliOptions || {};
  const cwd = process.cwd();
  const root = commonOpts.root ? resolve(cwd, commonOpts.root) : cwd;
  const envDirPath = commonOpts.envDir ? resolve(cwd, commonOpts.envDir) : cwd;

  const envs = loadEnv({
    cwd: envDirPath,
    mode: commonOpts.envMode,
  });

  const { content: config, filePath: configFilePath } = await loadConfig({
    cwd: root,
    path: commonOpts.config,
    envMode: commonOpts.envMode,
  });

  config.source ||= {};
  config.source.define = {
    ...envs.publicVars,
    ...config.source.define,
  };

  if (commonOpts.root) {
    config.root = root;
  }

  if (commonOpts.mode) {
    config.mode = commonOpts.mode;
  }

  if (commonOpts.open && !config.server?.open) {
    config.server ||= {};
    config.server.open = commonOpts.open;
  }

  if (commonOpts.host) {
    config.server ||= {};
    config.server.host = commonOpts.host;
  }

  if (commonOpts.port) {
    config.server ||= {};
    config.server.port = commonOpts.port;
  }

  // enable CLI shortcuts by default when using Rsbuild CLI
  if (config.dev?.cliShortcuts === undefined) {
    config.dev ||= {};
    config.dev.cliShortcuts = true;
  }

  const rsbuild = await createRsbuild({
    cwd: root,
    rsbuildConfig: config,
    environment: commonOpts.environment,
  });

  rsbuild.onCloseBuild(envs.cleanup);
  rsbuild.onCloseDevServer(envs.cleanup);

  return rsbuild;
}

interface ExtensionRunner {
  reloadAllExtensions: () => void;
  exit: () => void;
}

async function runDev(options: DevOptions) {
  const { target, ...cliOptions } = options;
  prepareRun(target);

  let webExt = null;
  let extensionRunner: ExtensionRunner | null = null;
  const root = cliOptions.root || process.cwd();

  if (cliOptions.open) {
    webExt = await import('web-ext')
      .then((mod) => mod.default)
      .catch(() => {
        console.warn(`Cannot find package 'web-ext', falling back to default open method.`);
        return null;
      });
  }

  const rsbuild = await init({
    cliOptions: {
      ...cliOptions,
      open: webExt ? false : cliOptions.open,
    },
  });

  if (cliOptions.open && webExt) {
    rsbuild.onDevCompileDone(async () => {
      if (extensionRunner !== null) return;

      const config = await normalizeWebExtRunConfig(root, {
        target: getBrowserTarget(),
        startUrl: typeof cliOptions.open === 'string' ? cliOptions.open : undefined,
        sourceDir: rsbuild.context.distPath,
      });

      webExt.cmd
        .run(config, {
          shouldExitProgram: false,
        })
        .then((runner: ExtensionRunner) => {
          extensionRunner = runner;
        });
    });

    rsbuild.onCloseDevServer(() => {
      extensionRunner?.exit();
    });
  }

  await rsbuild?.startDevServer();
}

async function runBuild(options: BuildOptions) {
  const { target, zip, ...cliOptions } = options;
  prepareRun(target);

  const rsbuild = await init({
    cliOptions,
  });
  const buildInstance = await rsbuild?.build({});
  await buildInstance?.close();

  if (zip) {
    await zipExtenison({
      root: options.root,
      source: rsbuild.context.distPath,
    });
  }
}

function prepareRun(target: string | undefined) {
  if (target) {
    process.env.WEB_EXTEND_TARGET = target;
  }
}

function getBrowserTarget(): TargetType {
  const target = process.env.WEB_EXTEND_TARGET || '';
  const browser = target?.includes('firefox') ? 'firefox-desktop' : 'chromium';
  return browser;
}

export { runDev, runBuild };

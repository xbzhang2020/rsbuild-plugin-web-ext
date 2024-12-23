import { resolve } from 'node:path';
import { createRsbuild, loadConfig, loadEnv } from '@rsbuild/core';
import type { RsbuildMode } from '@rsbuild/core';

interface CommonOptions {
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

export type DevOptions = CommonOptions;
export type BuildOptions = CommonOptions;

// forked form https://github.com/web-infra-dev/rsbuild/blob/main/packages/core/src/cli/init.ts
async function init({ cliOptions }: { cliOptions?: CommonOptions }) {
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

async function runDev({ cliOptions }: { cliOptions: DevOptions }) {
  const rsbuild = await init({ cliOptions });
  await rsbuild?.startDevServer();
}

async function runBuild({ cliOptions }: { cliOptions: BuildOptions }) {
  const rsbuild = await init({
    cliOptions: cliOptions,
  });
  const buildInstance = await rsbuild?.build({});
  await buildInstance?.close();
}

export { runDev, runBuild };

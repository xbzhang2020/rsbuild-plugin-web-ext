import { program } from 'commander';
import type { Command } from 'commander';
import { generateIcons } from './generate.js';
import type { GenerateOptions } from './generate.js';
import { runBuild, runDev } from './rsbuild.js';
import type { BuildOptions as RsbuildBuildOptions, DevOptions as RsbuildDevOptions } from './rsbuild.js';

interface CommonRunOptions {
  target?: string;
}

function main() {
  const generateCommand = program
    .command('generate')
    .alias('g')
    .argument('<type>', 'type of files')
    .description('generate files');
  const rsbuildDevCommand = program.command('rsbuild:dev').description('execute the dev command of rsbuild');
  const rsbuildBuildCommand = program.command('rsbuild:build').description('execute the build command of rsbuild');

  applyCommonGenerateOptions(generateCommand);
  generateCommand.action(async (type, options: GenerateOptions) => {
    try {
      if (type === 'icons') {
        await generateIcons(options);
      }
      console.log(`Generated ${type} successfully!`);
    } catch (error) {
      console.error(`Generated ${type} failed:`, (error as Error).message);
      process.exit(1);
    }
  });

  applyCommonRunOptions(rsbuildDevCommand);
  applyServerOptions(rsbuildDevCommand);
  rsbuildDevCommand.action(async (options: CommonRunOptions & RsbuildDevOptions) => {
    const { target, ...rsbuildCliOptions } = options;
    prepareRun(target);

    try {
      await runDev({ cliOptions: rsbuildCliOptions });
    } catch (err) {
      console.error('Failed to start dev server.');
      console.error(err);
      process.exit(1);
    }
  });

  applyCommonRunOptions(rsbuildBuildCommand);
  rsbuildBuildCommand.action(async (options: CommonRunOptions & RsbuildBuildOptions) => {
    const { target, ...rsbuildCliOptions } = options;
    prepareRun(target);
    try {
      await runBuild({ cliOptions: rsbuildCliOptions });
    } catch (err) {
      console.error('Failed to build.');
      console.error(err);
      process.exit(1);
    }
  });

  program.parse();
}

function applyCommonGenerateOptions(command: Command) {
  command
    .option('-r, --root <dir>', 'specify the project root directory')
    .option('-t, --template <name>', "specify the template's name or path")
    .option('--out-dir <dir>', 'specify the output directory')
    .option('--filename <name>', 'specify the output filename')
    .option('--size <size>', 'specify sizes of output icons (defaults to 16,32,48,64,128)');
}

function applyCommonRunOptions(command: Command) {
  command
    .option('-r, --root <root>', 'specify the project root directory')
    .option('-c --config <config>', 'specify the configuration file')
    .option('-m --mode <mode>', 'specify the build mode, can be `development`, `production` or `none`')
    .option('--env-mode <mode>', 'specify the env mode to load the `.env.[mode]` file')
    .option('--env-dir <dir>', 'specify the directory to load `.env` files')
    .option('-t, --target <target>', 'specify the extension target');
}

function applyServerOptions(command: Command) {
  command
    .option('-o --open [url]', 'open the page in browser on startup')
    .option('--port <port>', 'specify a port number for server to listen');
}

function prepareRun(target: string | undefined) {
  if (target) {
    process.env.WEB_EXTEND_TARGET = target;
  }
}

export { main };

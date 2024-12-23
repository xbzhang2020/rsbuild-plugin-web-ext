import { program } from 'commander';
import type { Command } from 'commander';
import { generateIcons } from './generate.js';
import { runBuild, runDev } from './rsbuild.js';

function applyCommonRsbuildOptions(command: Command) {
  command
    .option('-r, --root <root>', 'specify the project root directory')
    .option('-c --config <config>', 'specify the configuration file')
    .option('-m --mode <mode>', 'specify the build mode, can be `development`, `production` or `none`')
    .option('--env-mode <mode>', 'specify the env mode to load the `.env.[mode]` file')
    .option('--env-dir <dir>', 'specify the directory to load `.env` files')
    .option('-t, --target <target>', 'specify the extension target');
}

function main() {
  const generateCommand = program.command('generate').alias('g').description('generate files');
  const rsbuildDevCommand = program.command('rsbuild:dev').description('execute the dev command of rsbuild');
  const rsbuildBuildCommand = program.command('rsbuild:build').description('execute the build command of rsbuild');

  generateCommand
    .argument('<type>', 'type of file (icons)')
    .option('-r, --root <dir>', 'specify the project root directory')
    .option('-t, --template <name>', "template's name or path")
    .option('-s, --size <size>', 'sizes of output icons (defaults to 16,32,48,64,128)')
    .option('-o, --out-dir <dir>', 'output directory')
    .action(async (type, options) => {
      if (type === 'icons') {
        try {
          console.log('options', options);
          await generateIcons(options);
          console.log('Generated icons successfully!');
        } catch (error) {
          console.error('Generated icons failed:', (error as Error).message);
          process.exit(1);
        }
      }
    });

  for (const command of [rsbuildDevCommand, rsbuildBuildCommand]) {
    applyCommonRsbuildOptions(command);
  }

  rsbuildDevCommand.action((options = {}) => {
    // TODO: try-catch
    const { target, ...rsbuildCliOptions } = options;
    if (options.target) {
      process.env.WEB_EXTEND_TARGET = options.target;
    }
    runDev({ cliOptions: rsbuildCliOptions });
  });

  rsbuildBuildCommand.action((options) => {
    // TODO: support watch mode
    const { target, ...rsbuildCliOptions } = options;
    if (options.target) {
      process.env.WEB_EXTEND_TARGET = options.target;
    }
    runBuild({ cliOptions: rsbuildCliOptions });
  });

  program.parse();
}

export { main };
